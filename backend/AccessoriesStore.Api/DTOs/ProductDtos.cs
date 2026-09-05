using Microsoft.AspNetCore.Http;

namespace AccessoriesStore.Api.DTOs;

public record CategoryDto(
    int Id,
    string Slug,
    string Name
);

public record ProductDto(
    int Id,
    string Name,
    string? Description,
    decimal Price,
    decimal? OldPrice,
    string ImageUrl,
    string Category
);

public class ProductUpsertRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public decimal? OldPrice { get; set; }
    public string Category { get; set; } = string.Empty;

    public IFormFile? Image { get; set; }
}
