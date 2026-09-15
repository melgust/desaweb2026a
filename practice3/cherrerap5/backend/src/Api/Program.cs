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
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddHttpClient<ICatalogClient, CatalogClient>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["CatalogService:BaseUrl"] ?? "http://localhost:8080/");
    client.Timeout = TimeSpan.FromSeconds(10);
});

// JWT authentication
var jwtKey = builder.Configuration["Jwt:Key"]!;
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException("Configure Jwt__Key with at least 32 characters.");
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
        policy.WithOrigins((builder.Configuration["Cors:AllowedOrigins"] ?? "http://localhost:4200,http://localhost:81").Split(','))
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.Use(async (context, next) =>
{
    try { await next(context); }
    catch (Exception error)
    {
        var status = error switch
        {
            ArgumentException => 400, KeyNotFoundException => 404,
            InvalidOperationException => 409, DbUpdateException => 409,
            HttpRequestException => 503, TaskCanceledException => 503, _ => 500
        };
        app.Logger.LogWarning(error, "Request failed: {Method} {Path}", context.Request.Method, context.Request.Path);
        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(new { message = status >= 500 ? "Service unavailable; retry later." : error is DbUpdateException ? "Conflicting invoice data." : error.Message });
    }
});

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
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", async (AppDbContext db) =>
    await db.Database.CanConnectAsync() ? Results.Ok(new { status = "UP" }) : Results.Json(new { status = "DOWN" }, statusCode: 503));

app.Run();
