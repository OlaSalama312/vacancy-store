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
    public ProductsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<ProductDto>>> GetAll([FromQuery] string? category)
    {
        var query = _db.Products.Include(p => p.Category).Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(p => p.Category!.Slug == category);

        var products = await query
            .OrderByDescending(p => p.Id)
            .Select(p => new ProductDto(p.Id, p.Name, p.Description, p.Price, p.OldPrice, p.ImageUrl, p.Category!.Slug))
            .ToListAsync();

        return Ok(products);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDto>> GetOne(int id)
    {
        var p = await _db.Products.Include(x => x.Category).FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return NotFound(new { message = "المنتج مش موجود" });

        return Ok(new ProductDto(p.Id, p.Name, p.Description, p.Price, p.OldPrice, p.ImageUrl, p.Category!.Slug));
    }
}
