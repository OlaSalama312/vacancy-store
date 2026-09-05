namespace AccessoriesStore.Api.Models;

public enum OrderStatus
{
    Pending,
    Paid,
    Shipped,
    Delivered,
    Cancelled
}

public enum PaymentMethod
{
    Card,
    CashOnDelivery
}
