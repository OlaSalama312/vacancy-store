using AccessoriesStore.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace AccessoriesStore.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Category>()
            .HasIndex(c => c.Slug)
            .IsUnique();

        builder.Entity<Product>()
            .Property(p => p.Price)
            .HasPrecision(10, 2);

        builder.Entity<Product>()
            .Property(p => p.OldPrice)
            .HasPrecision(10, 2);

        builder.Entity<Order>()
            .Property(o => o.Total)
            .HasPrecision(10, 2);

        builder.Entity<OrderItem>()
            .Property(oi => oi.Price)
            .HasPrecision(10, 2);

        builder.Entity<Order>()
            .HasMany(o => o.Items)
            .WithOne(i => i.Order!)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Seed default categories so the store isn't empty on first run
        builder.Entity<Category>().HasData(
            new Category { Id = 1, Slug = "rings", Name = "خواتم" },
            new Category { Id = 2, Slug = "bracelets", Name = "أساور" },
            new Category { Id = 3, Slug = "necklaces", Name = "سلاسل" },
            new Category { Id = 4, Slug = "earrings", Name = "حلق" },
            new Category { Id = 5, Slug = "hair", Name = "إكسسوارات شعر" },
            new Category { Id = 6, Slug = "bags", Name = "شنط" }
        );
    }
}
