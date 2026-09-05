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
            o.Items.Select(i => new OrderItemDto(
                i.ProductId,
                i.ProductName,
                i.Price,
                i.Quantity
            )).ToList()
        )).ToList();

        return Ok(result);
    }

    [HttpPut("orders/{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        UpdateOrderStatusRequest req)
    {
        var order = await _db.Orders.FindAsync(id);

        if (order == null)
            return NotFound(new { message = "الطلب مش موجود" });

        if (!Enum.TryParse<OrderStatus>(req.Status, true, out var status))
            return BadRequest(new { message = "حالة غير معروفة" });

        order.Status = status;

        await _db.SaveChangesAsync();

        return NoContent();
    }

    // ---------- Products ----------

    [HttpPost("products")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<ProductDto>> CreateProduct(
        [FromForm] ProductUpsertRequest req)
    {
        var category = await _db.Categories
            .FirstOrDefaultAsync(c => c.Slug == req.Category);

        if (category == null)
            return BadRequest(new { message = "القسم مش موجود" });

        var product = new Product
        {
            Name = req.Name,
            Description = req.Description,
            Price = req.Price,
            OldPrice = req.OldPrice,
            CategoryId = category.Id,
            ImageUrl = ""
        };

        if (req.Image != null)
        {
            if (!req.Image.ContentType.StartsWith("image/"))
                return BadRequest(new { message = "من فضلك اختاري صورة فقط" });

            using var stream = new MemoryStream();
            await req.Image.CopyToAsync(stream);

            product.ImageData = stream.ToArray();
            product.ImageContentType = req.Image.ContentType;
        }

        _db.Products.Add(product);

        await _db.SaveChangesAsync();

      var imageUrl = product.ImageData != null
    ? $"{Request.Scheme}://{Request.Host}/api/products/{product.Id}/image"
    : "";

        return Ok(new ProductDto(
            product.Id,
            product.Name,
            product.Description,
            product.Price,
            product.OldPrice,
            imageUrl,
            category.Slug
        ));
    }

    [HttpPut("products/{id:int}")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> UpdateProduct(
        int id,
        [FromForm] ProductUpsertRequest req)
    {
        var product = await _db.Products.FindAsync(id);

        if (product == null)
            return NotFound(new { message = "المنتج مش موجود" });

        var category = await _db.Categories
            .FirstOrDefaultAsync(c => c.Slug == req.Category);

        if (category == null)
            return BadRequest(new { message = "القسم مش موجود" });

        product.Name = req.Name;
        product.Description = req.Description;
        product.Price = req.Price;
        product.OldPrice = req.OldPrice;
        product.CategoryId = category.Id;

        // لو اختار صورة جديدة، نستبدل الصورة القديمة
        if (req.Image != null)
        {
            if (!req.Image.ContentType.StartsWith("image/"))
                return BadRequest(new { message = "من فضلك اختاري صورة فقط" });

            using var stream = new MemoryStream();
            await req.Image.CopyToAsync(stream);

            product.ImageData = stream.ToArray();
            product.ImageContentType = req.Image.ContentType;
            product.ImageUrl = "";
        }

        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("products/{id:int}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var product = await _db.Products.FindAsync(id);

        if (product == null)
            return NotFound(new { message = "المنتج مش موجود" });

        // Soft delete عشان الطلبات القديمة اللي بتشاور على المنتج ده متتأثرش
        product.IsActive = false;

        await _db.SaveChangesAsync();

        return NoContent();
    }
}