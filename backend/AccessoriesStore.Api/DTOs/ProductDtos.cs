namespace AccessoriesStore.Api.DTOs;

public record CategoryDto(int Id, string Slug, string Name);

public record ProductDto(
    int Id,
    string Name,
    string? Description,
    decimal Price,
    decimal? OldPrice,
    string ImageUrl,
    string Category
);

public record ProductUpsertRequest(
    string Name,
    string? Description,
    decimal Price,
    decimal? OldPrice,
    string ImageUrl,
    string Category // slug
);
