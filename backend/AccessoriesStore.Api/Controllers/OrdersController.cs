using System.Security.Claims;
using AccessoriesStore.Api.Data;
using AccessoriesStore.Api.DTOs;
using AccessoriesStore.Api.Models;
using AccessoriesStore.Api.Services;
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
    private readonly PaymobService _paymob;

    public OrdersController(AppDbContext db, PaymobService paymob)
    {
        _db = db;
        _paymob = paymob;
    }

    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")!;

    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create(CreateOrderRequest req)
    {
        if (req.Items == null || req.Items.Count == 0)
            return BadRequest(new { message = "السلة فاضية" });

        var productIds = req.Items.Select(i => i.ProductId).ToList();

        var products = await _db.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync();

        if (products.Count != productIds.Distinct().Count())
            return BadRequest(new { message = "في منتج مش موجود في السلة" });

        var paymentMethod = req.PaymentMethod == "card"
            ? PaymentMethod.Card
            : PaymentMethod.CashOnDelivery;

        var order = new Order
        {
            UserId = CurrentUserId,
            ShippingCity = req.ShippingCity,
            ShippingAddress = req.ShippingAddress,
            Notes = req.Notes,
            PaymentMethod = paymentMethod,
            Status = OrderStatus.Pending,
        };

        foreach (var item in req.Items)
        {
            var product = products.First(p => p.Id == item.ProductId);

            order.Items.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Price = product.Price,
                Quantity = item.Quantity,
            });
        }

        order.Total = order.Items.Sum(i => i.Price * i.Quantity);

        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        var user = await _db.Users.FindAsync(CurrentUserId);

        // لو العميل اختار الدفع بالكارت
        if (paymentMethod == PaymentMethod.Card)
        {
            try
            {
                var paymentUrl = await _paymob.GetPaymentUrlAsync(order, user!);

                await _db.SaveChangesAsync();

                return Ok(new
                {
                    orderId = order.Id,
                    paymentUrl = paymentUrl
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "حصل خطأ أثناء تجهيز الدفع بالكارت",
                    error = ex.Message
                });
            }
        }

        // الدفع عند الاستلام
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
