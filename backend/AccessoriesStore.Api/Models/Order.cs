
namespace AccessoriesStore.Api.Models;

public class Order
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    public string ShippingCity { get; set; } = string.Empty;
    public string ShippingAddress { get; set; } = string.Empty;
    public string? Notes { get; set; }

    // مصاريف الشحن
    public decimal ShippingCost { get; set; }

    // الإجمالي النهائي شامل الشحن
    public decimal FinalTotal { get; set; }

    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.CashOnDelivery;
    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    // إجمالي المنتجات قبل الشحن
    public decimal Total { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // إثبات الدفع
    public byte[]? PaymentProof { get; set; }
    public string? PaymentProofContentType { get; set; }

    // Paymob tracking - موجودين للحفاظ على توافق قاعدة البيانات القديمة
    public string? PaymobOrderId { get; set; }
    public string? PaymobTransactionId { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}

public class OrderItem
{
    public int Id { get; set; }

    public int OrderId { get; set; }
    public Order? Order { get; set; }

    public int ProductId { get; set; }
    public Product? Product { get; set; }

    // Snapshot of name/price at time of order
    public string ProductName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}

