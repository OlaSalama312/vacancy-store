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
    Card = 0,
    CashOnDelivery = 1,
    InstaPay = 2,
    VodafoneCash = 3
}