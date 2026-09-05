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

    [HttpPost]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<OrderDto>> Create(
        [FromForm] CreateOrderRequest req)
    {
        if (req.Items == null || req.Items.Count == 0)
            return BadRequest(new
            {
                message = "السلة فاضية"
            });

        var productIds = req.Items
            .Select(i => i.ProductId)
            .ToList();

        var products = await _db.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync();

        if (products.Count != productIds.Distinct().Count())
            return BadRequest(new
            {
                message = "في منتج مش موجود في السلة"
            });

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

        // إثبات الدفع مطلوب فقط في InstaPay و Vodafone Cash
        if (
            (paymentMethod == PaymentMethod.InstaPay ||
             paymentMethod == PaymentMethod.VodafoneCash) &&
            req.PaymentProof == null
        )
        {
            return BadRequest(new
            {
                message = "من فضلك ارفعي صورة إثبات التحويل"
            });
        }

        // التأكد إن الملف صورة
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

            // الحد الأقصى 10 MB
            if (req.PaymentProof.Length > 10 * 1024 * 1024)
            {
                return BadRequest(new
                {
                    message = "حجم الصورة يجب ألا يتجاوز 10 ميجابايت"
                });
            }
        }

        var order = new Order
        {
            UserId = CurrentUserId,
            ShippingCity = req.ShippingCity,
            ShippingAddress = req.ShippingAddress,
            Notes = req.Notes,
            PaymentMethod = paymentMethod,
            Status = OrderStatus.Pending
        };

        // حفظ صورة إثبات الدفع داخل قاعدة البيانات
        if (req.PaymentProof != null)
        {
            using var memoryStream = new MemoryStream();

            await req.PaymentProof.CopyToAsync(memoryStream);

            order.PaymentProof = memoryStream.ToArray();
            order.PaymentProofContentType =
                req.PaymentProof.ContentType;
        }

        foreach (var item in req.Items)
        {
            var product = products.First(
                p => p.Id == item.ProductId);

            order.Items.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Price = product.Price,
                Quantity = item.Quantity
            });
        }

        order.Total = order.Items.Sum(
            i => i.Price * i.Quantity);

        _db.Orders.Add(order);

        await _db.SaveChangesAsync();

        var user = await _db.Users.FindAsync(CurrentUserId);

        return Ok(new OrderDto(
            order.Id,
            user?.FullName ?? "",
            order.Status.ToString(),
            order.Total,
            order.CreatedAt,
            order.Items
                .Select(i => new OrderItemDto(
                    i.ProductId,
                    i.ProductName,
                    i.Price,
                    i.Quantity))
                .ToList()
        ));
    }

    [HttpGet("mine")]
    public async Task<ActionResult<List<OrderDto>>> GetMine()
    {
        var orders = await _db.Orders
            .Include(o => o.Items)
            .Include(o => o.User)
            .Where(o => o.UserId == CurrentUserId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var result = orders.Select(o => new OrderDto(
            o.Id,
            o.User?.FullName ?? "",
            o.Status.ToString(),
            o.Total,
            o.CreatedAt,
            o.Items
                .Select(i => new OrderItemDto(
                    i.ProductId,
                    i.ProductName,
                    i.Price,
                    i.Quantity))
                .ToList()
        )).ToList();

        return Ok(result);
    }
}
