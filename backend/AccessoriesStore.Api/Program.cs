using System.Text;
using AccessoriesStore.Api.Data;
using AccessoriesStore.Api.Models;
using AccessoriesStore.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ---------- Services ----------

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.Password.RequiredLength = 6;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = false;
        options.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
        };
    });

builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<TokenService>();

// CORS - افتحيها للدومين بتاع الـ frontend وقت النشر بدل AllowAnyOrigin
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:5173" };
        policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

// ---------- Middleware ----------

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ---------- DB migrate + seed roles/admin on startup ----------

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // ملحوظة: بنستخدم EnsureCreated بدل Migrate لأنه لسه معملناش ملفات migrations فعلية
    // (محتاجة .NET SDK لعملها). ده بيعمل الجداول أول مرة تشغيل بس مش هيحدّث سكيما موجودة.
    // لما تبقى جاهزة تعملي migrations حقيقية، شغّلي:
    //   dotnet ef migrations add InitialCreate
    // واستبدلي السطر ده بـ: await db.Database.MigrateAsync();
    await db.Database.EnsureCreatedAsync();

    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    foreach (var role in new[] { "Admin", "Customer" })
    {
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole(role));
    }

    // بيعمل حساب أدمن أول مرة بس لو معرّف في appsettings (AdminSeed) ومش موجود قبل كده
    var adminEmail = app.Configuration["AdminSeed:Email"];
    var adminPassword = app.Configuration["AdminSeed:Password"];
    if (!string.IsNullOrWhiteSpace(adminEmail) && !string.IsNullOrWhiteSpace(adminPassword))
    {
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
        if (existingAdmin == null)
        {
            var admin = new ApplicationUser { UserName = adminEmail, Email = adminEmail, FullName = "Admin" };
            var result = await userManager.CreateAsync(admin, adminPassword);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(admin, "Admin");
        }
    }
}

app.Run();
