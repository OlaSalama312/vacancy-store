using System.Net.Http.Json;
using System.Text.Json;
using AccessoriesStore.Api.Models;

namespace AccessoriesStore.Api.Services;

/// <summary>
/// تكامل مع بوابة الدفع Paymob (الأكثر استخدامًا في مصر).
/// محتاجة تسجلي حساب تاجر على https://paymob.com وتجيبي منهم:
/// - API Key
/// - Integration ID (بتاع الكارت)
/// - Iframe ID
/// وتحطيهم في appsettings.json تحت قسم "Paymob".
/// التوثيق الرسمي: https://docs.paymob.com/docs/accept-standard-redirect
/// </summary>
public class PaymobService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;

    public PaymobService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _config = config;
        _http.BaseAddress = new Uri("https://accept.paymob.com/api/");
    }

    public async Task<string> GetPaymentUrlAsync(Order order, ApplicationUser user)
    {
        var apiKey = _config["Paymob:ApiKey"]
            ?? throw new InvalidOperationException("Paymob:ApiKey غير موجود في الإعدادات");
        var integrationId = _config["Paymob:IntegrationId"];
        var iframeId = _config["Paymob:IframeId"];

        // 1) Authentication - نجيب auth token من Paymob
        var authRes = await _http.PostAsJsonAsync("auth/tokens", new { api_key = apiKey });
        authRes.EnsureSuccessStatusCode();
        var authJson = await authRes.Content.ReadFromJsonAsync<JsonElement>();
        var authToken = authJson.GetProperty("token").GetString();

        // 2) Order registration - بنسجل الأوردر عند Paymob
        var amountCents = (int)(order.Total * 100);
        var orderRes = await _http.PostAsJsonAsync("ecommerce/orders", new
        {
            auth_token = authToken,
            delivery_needed = false,
            amount_cents = amountCents,
            currency = "EGP",
            merchant_order_id = order.Id.ToString(),
            items = Array.Empty<object>()
        });
        orderRes.EnsureSuccessStatusCode();
        var orderJson = await orderRes.Content.ReadFromJsonAsync<JsonElement>();
        var paymobOrderId = orderJson.GetProperty("id").GetInt64().ToString();

        // 3) Payment key request - مفتاح الدفع اللي بيتربط بالـ iframe
        var nameParts = user.FullName.Split(' ', 2);
        var firstName = nameParts.ElementAtOrDefault(0) ?? "Customer";
        var lastName = nameParts.ElementAtOrDefault(1) ?? "Customer";

        var keyRes = await _http.PostAsJsonAsync("acceptance/payment_keys", new
        {
            auth_token = authToken,
            amount_cents = amountCents,
            expiration = 3600,
            order_id = paymobOrderId,
            billing_data = new
            {
                first_name = firstName,
                last_name = lastName,
                email = user.Email,
                phone_number = user.PhoneNumber ?? "01000000000",
                city = order.ShippingCity,
                street = order.ShippingAddress,
                country = "EG",
                apartment = "NA",
                floor = "NA",
                building = "NA",
                postal_code = "NA",
                state = "NA"
            },
            currency = "EGP",
            integration_id = integrationId
        });
        keyRes.EnsureSuccessStatusCode();
        var keyJson = await keyRes.Content.ReadFromJsonAsync<JsonElement>();
        var paymentToken = keyJson.GetProperty("token").GetString();

        order.PaymobOrderId = paymobOrderId;

        // 4) رابط الـ iframe اللي المستخدم هيدفع منه فعليًا
        return $"https://accept.paymob.com/api/acceptance/iframes/{iframeId}?payment_token={paymentToken}";
    }
}
