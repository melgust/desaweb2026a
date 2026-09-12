using System.Text;
using Application.Services;
using Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Register MySQL AppDbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Application services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ISupplierService, SupplierService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();

// JWT authentication
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// CORS so the Angular frontend can call the API
const string CorsPolicy = "AllowFrontend";
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Automatically apply migrations and seed initial data on application startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
    await DbSeeder.SeedAsync(dbContext);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(CorsPolicy);
app.Use(async (context, next) =>
{
    try { await next(context); }
    catch (Exception ex) when (ex is KeyNotFoundException or ArgumentException or
        InvalidOperationException or UnauthorizedAccessException or DbUpdateException)
    {
        var (status, message) = ex switch
        {
            KeyNotFoundException => (404, ex.Message),
            UnauthorizedAccessException => (401, ex.Message),
            ArgumentException => (400, ex.Message),
            InvalidOperationException => (400, ex.Message),
            DbUpdateException db when db.InnerException is MySqlConnector.MySqlException { Number: 1062 }
                => (400, "Ya existe un registro con ese identificador único."),
            DbUpdateException db when db.InnerException is MySqlConnector.MySqlException { Number: 1451 or 1452 }
                => (400, "No se puede guardar o eliminar: el registro está relacionado con otra información."),
            _ => (500, "No se pudo guardar la información.")
        };
        if (status == 500) app.Logger.LogError(ex, "Database operation failed");
        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(new { message });
    }
});
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
