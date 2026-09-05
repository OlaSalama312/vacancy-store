namespace AccessoriesStore.Api.Models;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public decimal? OldPrice { get; set; }

    // الصورة القديمة - هنسيبها مؤقتًا عشان المنتجات القديمة متبوظش
    public string ImageUrl { get; set; } = string.Empty;

    // الصورة الجديدة المرفوعة من الجهاز
    public byte[]? ImageData { get; set; }
    public string? ImageContentType { get; set; }

    public bool IsActive { get; set; } = true;

    public int CategoryId { get; set; }
    public Category? Category { get; set; }
}
