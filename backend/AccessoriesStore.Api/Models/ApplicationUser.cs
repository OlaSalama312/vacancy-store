using Microsoft.AspNetCore.Identity;

namespace AccessoriesStore.Api.Models;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;

    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
