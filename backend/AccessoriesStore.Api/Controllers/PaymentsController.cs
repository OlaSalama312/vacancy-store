using System.Security.Claims;
using AccessoriesStore.Api.Data;
using AccessoriesStore.Api.DTOs;
using AccessoriesStore.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AccessoriesStore.Api.Controllers;

[ApiController]
[Route("api/payments")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly PaymobService _paymob;

    public PaymentsController(AppDbContext db, PaymobService paymob)
    {
        _db = db;
        _paymob = paymob;
    }

    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")!;

    [HttpPost("paymob/initiate")]
    public async Task<ActionResult<InitiatePaymentResponse>> Initiate(InitiatePaymentRequest req)
    {
        var order = await _db.Orders.FindAsync(req.OrderId);
        if (order == null || order.UserId != CurrentUserId)
            return NotFound(new { message = "الطلب مش موجود" });

        var user = await _db.Users.FindAsync(CurrentUserId);
        if (user == null) return Unauthorized();

        try
        {
            var url = await _paymob.GetPaymentUrlAsync(order, user);
            await _db.SaveChangesAsync(); // يحفظ PaymobOrderId اللي اتحط على order جوه الـ service
            return Ok(new InitiatePaymentResponse(url));
        }
        catch (Exception ex)
        {
            return StatusCode(502, new { message = "فشل الاتصال ببوابة الدفع", detail = ex.Message });
        }
    }

    /// <summary>
    /// Paymob بيبعت على الـ webhook ده بعد ما الدفع يخلص (HMAC-verified في إنتاج حقيقي).
    /// راجعي https://docs.paymob.com/docs/transaction-callbacks لتفاصيل توثيق التوقيع.
    /// </summary>
    [HttpPost("paymob/callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback([FromQuery] string? merchant_order_id, [FromQuery] string? success)
    {
        if (!string.IsNullOrEmpty(merchant_order_id) && int.TryParse(merchant_order_id, out var orderId))
        {
            var order = await _db.Orders.FindAsync(orderId);
            if (order != null && success == "true")
            {
                order.Status = Models.OrderStatus.Paid;
                await _db.SaveChangesAsync();
            }
        }
        return Ok();
    }
}
