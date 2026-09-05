using AccessoriesStore.Api.Data;
using AccessoriesStore.Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccessoriesStore.Api.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    public CategoriesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll()
    {
        var categories = await _db.Categories
            .OrderBy(c => c.Id)
            .Select(c => new CategoryDto(c.Id, c.Slug, c.Name))
            .ToListAsync();

        return Ok(categories);
    }
}
