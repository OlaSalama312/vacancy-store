using System.Security.Claims;
using AccessoriesStore.Api.Data;
using AccessoriesStore.Api.DTOs;
using AccessoriesStore.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccessoriesStore.Api.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _db;

    public OrdersController(AppDbContext db)
    {
        _db = db;
    }

    private string CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException();

    // =========================================
    // Create Order
    // =========================================

    [HttpPost]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<OrderDto>> Create(
        [FromForm] CreateOrderRequest req)
    {
        if (req.Items == null || req.Items.Count == 0)
        {
            return BadRequest(new
            {
                message = "السلة فاضية"
            });
        }

        var productIds = req.Items
            .Select(i => i.ProductId)
            .ToList();

        var products = await _db.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync();

        if (products.Count != productIds.Distinct().Count())
        {
            return BadRequest(new
            {
                message = "في منتج مش موجود في السلة"
            });
        }

        PaymentMethod paymentMethod;

        switch (req.PaymentMethod?.ToLower())
        {
            case "instapay":
                paymentMethod = PaymentMethod.InstaPay;
                break;

            case "vodafone_cash":
                paymentMethod = PaymentMethod.VodafoneCash;
                break;

            case "cod":
                paymentMethod = PaymentMethod.CashOnDelivery;
                break;

            default:
                return BadRequest(new
                {
                    message = "طريقة الدفع غير صحيحة"
                });
        }

        // =========================================
        // Payment Proof Validation
        // =========================================

        if (
            (paymentMethod == PaymentMethod.InstaPay ||
             paymentMethod == PaymentMethod.VodafoneCash) &&
            req.PaymentProof == null)
        {
            return BadRequest(new
            {
                message = "من فضلك ارفعي صورة إثبات التحويل"
            });
        }

        if (req.PaymentProof != null)
        {
            var allowedTypes = new[]
            {
                "image/jpeg",
                "image/png",
                "image/webp"
            };

            if (!allowedTypes.Contains(
                    req.PaymentProof.ContentType.ToLower()))
            {
                return BadRequest(new
                {
                    message = "مسموح فقط بصور JPG أو PNG أو WEBP"
                });
            }

            if (req.PaymentProof.Length > 10 * 1024 * 1024)
            {
                return BadRequest(new
                {
                    message = "حجم الصورة يجب ألا يتجاوز 10 ميجابايت"
                });
            }
        }

        // =========================================
        // Shipping
        // =========================================

        var shippingCost = GetShippingCost(
            req.ShippingCity
        );

        if (shippingCost == null)
        {
            return BadRequest(new
            {
                message = "من فضلك اختاري منطقة صحيحة داخل القاهرة"
            });
        }

        // =========================================
        // Create Order
        // =========================================

        var order = new Order
        {
            UserId = CurrentUserId,

            ShippingCity = req.ShippingCity,

            ShippingAddress = req.ShippingAddress,

            Notes = req.Notes,

            ShippingCost = shippingCost.Value,

            PaymentMethod = paymentMethod,

            Status = OrderStatus.Pending
        };

        // =========================================
        // Save Payment Proof
        // =========================================

        if (req.PaymentProof != null)
        {
            using var memoryStream = new MemoryStream();

            await req.PaymentProof.CopyToAsync(
                memoryStream
            );

            order.PaymentProof =
                memoryStream.ToArray();

            order.PaymentProofContentType =
                req.PaymentProof.ContentType;
        }

        // =========================================
        // Order Items
        // =========================================

        foreach (var item in req.Items)
        {
            var product = products.First(
                p => p.Id == item.ProductId
            );

            order.Items.Add(new OrderItem
            {
                ProductId = product.Id,

                ProductName = product.Name,

                Price = product.Price,

                Quantity = item.Quantity
            });
        }

        // =========================================
        // Totals
        // =========================================

        order.Total = order.Items.Sum(
            i => i.Price * i.Quantity
        );

        order.FinalTotal =
            order.Total + order.ShippingCost;

        // =========================================
        // Save
        // =========================================

        _db.Orders.Add(order);

        await _db.SaveChangesAsync();

        // =========================================
        // User
        // =========================================

        var user = await _db.Users.FindAsync(
            CurrentUserId
        );

        // =========================================
        // Response
        // =========================================

        var paymentProofUrl =
            order.PaymentProof != null
                ? $"{Request.Scheme}://{Request.Host}/api/admin/orders/{order.Id}/payment-proof"
                : null;

        return Ok(new OrderDto(
            order.Id,

            user?.FullName ?? "",

            order.Status.ToString(),

            order.Total,

            order.ShippingCost,

            order.FinalTotal,

            order.CreatedAt,

            order.Notes,

            order.PaymentMethod.ToString(),

            paymentProofUrl,

            order.Items
                .Select(i => new OrderItemDto(
                    i.ProductId,
                    i.ProductName,
                    i.Price,
                    i.Quantity
                ))
                .ToList()
        ));
    }

    // =========================================
    // My Orders
    // =========================================

    [HttpGet("mine")]
    public async Task<ActionResult<List<OrderDto>>> GetMine()
    {
        var orders = await _db.Orders
            .Include(o => o.Items)
            .Include(o => o.User)
            .Where(o => o.UserId == CurrentUserId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var result = orders.Select(o =>
            new OrderDto(
                o.Id,

                o.User?.FullName ?? "",

                o.Status.ToString(),

                o.Total,

                o.ShippingCost,

                o.FinalTotal,

                o.CreatedAt,

                o.Notes,

                o.PaymentMethod.ToString(),

                o.PaymentProof != null
                    ? $"{Request.Scheme}://{Request.Host}/api/admin/orders/{o.Id}/payment-proof"
                    : null,

                o.Items
                    .Select(i => new OrderItemDto(
                        i.ProductId,
                        i.ProductName,
                        i.Price,
                        i.Quantity
                    ))
                    .ToList()
            )
        ).ToList();

        return Ok(result);
    }

    // =========================================
    // Shipping Calculation
    // =========================================

    private static decimal? GetShippingCost(
        string area)
    {
        if (string.IsNullOrWhiteSpace(area))
            return null;

        var normalizedArea = area.Trim();

        // =========================================
        // Cairo Time
        // =========================================

        var cairoTime =
            TimeZoneInfo.ConvertTimeBySystemTimeZoneId(
                DateTime.UtcNow,
                "Africa/Cairo"
            );

        var today = cairoTime.Date;

        // =========================================
        // Free Shipping Period
        // =========================================

        var freeShippingStart =
            new DateTime(2026, 9, 9);

        var freeShippingEnd =
            new DateTime(2026, 12, 31);

        // =========================================
        // Nearby Areas - 40 EGP
        // =========================================

        var nearbyAreas = new[]
        {
            "مدينة نصر",
            "مصر الجديدة",
            "العباسية",
            "روكسي",
            "سراي القبة",
            "حدائق القبة",
            "الزيتون",
            "عين شمس",
            "المطرية"
        };

        // =========================================
        // Medium Areas - 60 EGP
        // =========================================

        var mediumAreas = new[]
        {
            "المعادي",
            "المقطم",
            "شبرا",
            "وسط البلد",
            "الزمالك"
        };

        // =========================================
        // Far Areas - 80 EGP
        // =========================================

        var farAreas = new[]
        {
            "التجمع الأول",
            "التجمع الخامس",
            "القاهرة الجديدة",
            "الشروق",
            "بدر",
            "مدينتي",
            "العاصمة الإدارية"
        };

        // =========================================
        // Free Shipping
        // 09/09/2026 -> 31/12/2026
        // =========================================

        if (
            today >= freeShippingStart &&
            today <= freeShippingEnd
        )
        {
            if (
                nearbyAreas.Contains(normalizedArea) ||
                mediumAreas.Contains(normalizedArea) ||
                farAreas.Contains(normalizedArea)
            )
            {
                return 0m;
            }

            return null;
        }

        // =========================================
        // Normal Shipping
        // =========================================

        if (nearbyAreas.Contains(normalizedArea))
            return 40m;

        if (mediumAreas.Contains(normalizedArea))
            return 60m;

        if (farAreas.Contains(normalizedArea))
            return 80m;

        return null;
    }
}

