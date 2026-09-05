
using Microsoft.AspNetCore.Http;

namespace AccessoriesStore.Api.DTOs;

public record OrderItemRequest(
    int ProductId,
    int Quantity
);

public class CreateOrderRequest
{
    public List<OrderItemRequest> Items { get; set; } = new();

    public string ShippingCity { get; set; } = string.Empty;

    public string ShippingAddress { get; set; } = string.Empty;

    public decimal ShippingCost { get; set; }

    public decimal FinalTotal { get; set; }

    public string? Notes { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;

    public IFormFile? PaymentProof { get; set; }
}

public record OrderItemDto(
    int ProductId,
    string ProductName,
    decimal Price,
    int Quantity
);

public record OrderDto(
    int Id,
    string CustomerName,
    string Status,
    decimal Total,
    decimal ShippingCost,
    decimal FinalTotal,
    DateTime CreatedAt,
    string? Notes,
    List<OrderItemDto> Items
);

public record UpdateOrderStatusRequest(
    string Status
);

public record InitiatePaymentRequest(
    int OrderId
);

public record InitiatePaymentResponse(
    string PaymentUrl
);





