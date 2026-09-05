using AccessoriesStore.Api.Data;
using AccessoriesStore.Api.DTOs;
using AccessoriesStore.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccessoriesStore.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    public AdminController(AppDbContext db) => _db = db;

    // ---------- Orders ----------

    [HttpGet("orders")]
    public async Task<ActionResult<List<OrderDto>>> GetAllOrders()
    {
        var orders = await _db.Orders
            .Include(o => o.Items)
            .Include(o => o.User)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var result = orders.Select(o => new OrderDto(
            o.Id,
            o.User?.FullName ?? "",
            o.Status.ToString(),
            o.Total,
            o.CreatedAt,
            o.Items.Select(i => new OrderItemDto(i.ProductId, i.ProductName, i.Price, i.Quantity)).ToList()
        )).ToList();

        return Ok(result);
    }

    [HttpPut("orders/{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateOrderStatusRequest req)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null) return NotFound(new { message = "الطلب مش موجود" });

        if (!Enum.TryParse<OrderStatus>(req.Status, true, out var status))
            return BadRequest(new { message = "حالة غير معروفة" });

        order.Status = status;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ---------- Products ----------

    [HttpPost("products")]
    public async Task<ActionResult<ProductDto>> CreateProduct(ProductUpsertRequest req)
    {
        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Slug == req.Category);
        if (category == null) return BadRequest(new { message = "القسم مش موجود" });

        var product = new Product
        {
            Name = req.Name,
            Description = req.Description,
            Price = req.Price,
            OldPrice = req.OldPrice,
            ImageUrl = req.ImageUrl,
            CategoryId = category.Id,
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        return Ok(new ProductDto(product.Id, product.Name, product.Description, product.Price, product.OldPrice, product.ImageUrl, category.Slug));
    }

    [HttpPut("products/{id:int}")]
    public async Task<IActionResult> UpdateProduct(int id, ProductUpsertRequest req)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound(new { message = "المنتج مش موجود" });

        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Slug == req.Category);
        if (category == null) return BadRequest(new { message = "القسم مش موجود" });

        product.Name = req.Name;
        product.Description = req.Description;
        product.Price = req.Price;
        product.OldPrice = req.OldPrice;
        product.ImageUrl = req.ImageUrl;
        product.CategoryId = category.Id;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("products/{id:int}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound(new { message = "المنتج مش موجود" });

        // Soft delete عشان الطلبات القديمة اللي بتشاور على المنتج ده متتأثرش
        product.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
