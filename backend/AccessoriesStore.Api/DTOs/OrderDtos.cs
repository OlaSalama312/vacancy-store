namespace AccessoriesStore.Api.DTOs;

public record OrderItemRequest(int ProductId, int Quantity);

public record CreateOrderRequest(
    List<OrderItemRequest> Items,
    string ShippingCity,
    string ShippingAddress,
    string? Notes,
    string PaymentMethod // "card" | "cod"
);

public record OrderItemDto(int ProductId, string ProductName, decimal Price, int Quantity);

public record OrderDto(
    int Id,
    string CustomerName,
    string Status,
    decimal Total,
    DateTime CreatedAt,
    List<OrderItemDto> Items
);

public record UpdateOrderStatusRequest(string Status);

public record InitiatePaymentRequest(int OrderId);
public record InitiatePaymentResponse(string PaymentUrl);
