using AccessoriesStore.Api.DTOs;
using AccessoriesStore.Api.Models;
using AccessoriesStore.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace AccessoriesStore.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly TokenService _tokenService;

    public AuthController(UserManager<ApplicationUser> userManager, TokenService tokenService)
    {
        _userManager = userManager;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req)
    {
        var existing = await _userManager.FindByEmailAsync(req.Email);
        if (existing != null)
            return BadRequest(new { message = "البريد الإلكتروني ده مسجل قبل كده" });

        var user = new ApplicationUser
        {
            UserName = req.Email,
            Email = req.Email,
            FullName = req.Name,
            PhoneNumber = req.Phone,
        };

        var result = await _userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });

        await _userManager.AddToRoleAsync(user, "Customer");

        var token = _tokenService.CreateToken(user, "Customer");
        return Ok(new AuthResponse(token));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
    {
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, req.Password))
            return Unauthorized(new { message = "البريد الإلكتروني أو كلمة المرور غلط" });

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.Contains("Admin") ? "Admin" : "Customer";

        var token = _tokenService.CreateToken(user, role);
        return Ok(new AuthResponse(token));
    }
}
