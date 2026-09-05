using AccessoriesStore.Api.Data;
using AccessoriesStore.Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccessoriesStore.Api.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProductsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProductDto>>> GetAll(
        [FromQuery] string? category)
    {
        var query = _db.Products
            .Include(p => p.Category)
            .Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(p => p.Category!.Slug == category);
        }

        var products = await query
            .OrderByDescending(p => p.Id)
            .ToListAsync();

        var result = products.Select(p => new ProductDto(
            p.Id,
            p.Name,
            p.Description,
            p.Price,
            p.OldPrice,
            p.ImageData != null
                ? $"{Request.Scheme}://{Request.Host}/api/products/{p.Id}/image"
                : p.ImageUrl,
            p.Category!.Slug
        )).ToList();

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDto>> GetOne(int id)
    {
        var p = await _db.Products
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (p == null)
        {
            return NotFound(new
            {
                message = "المنتج مش موجود"
            });
        }

        var imageUrl = p.ImageData != null
            ? $"{Request.Scheme}://{Request.Host}/api/products/{p.Id}/image"
            : p.ImageUrl;

        return Ok(new ProductDto(
            p.Id,
            p.Name,
            p.Description,
            p.Price,
            p.OldPrice,
            imageUrl,
            p.Category!.Slug
        ));
    }

    [HttpGet("{id:int}/image")]
    public async Task<IActionResult> GetImage(int id)
    {
        var product = await _db.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null || product.ImageData == null)
        {
            return NotFound();
        }

        return File(
            product.ImageData,
            product.ImageContentType ?? "image/jpeg"
        );
    }
}
