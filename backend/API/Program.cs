using Microsoft.EntityFrameworkCore;
using Data.Context;
using API.Middleware;
using API.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Application;
using Application.Infrastructure;
using DataAccess;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState
            .Where(kvp => kvp.Value?.Errors.Count > 0)
            .ToDictionary(
                kvp => kvp.Key,
                kvp => kvp.Value!.Errors.Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? "Invalid value" : e.ErrorMessage).ToArray());

        return new BadRequestObjectResult(new
        {
            message = "Validation failed",
            errors
        });
    };
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://localhost:8080")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Configure DbContext with PostgreSQL
builder.Services.AddDbContext<HRPortalDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentAdminProvider, HeaderCurrentAdminProvider>();

builder.Services.AddDataAccess();
builder.Services.AddApplication();

// Kafka integration (optional - enable when Kafka is running)
var kafkaSection = builder.Configuration.GetSection("Kafka");
if (kafkaSection.Exists())
{
    builder.Services.AddKafka(options =>
    {
        options.BootstrapServers = kafkaSection["BootstrapServers"] ?? "localhost:9092";
        options.GroupId = kafkaSection["GroupId"] ?? "hr-portal-group";
        options.ClientId = kafkaSection["ClientId"] ?? "hr-portal-api";
        options.EnableAutoCommit = bool.Parse(kafkaSection["EnableAutoCommit"] ?? "true");
        options.SessionTimeoutMs = int.Parse(kafkaSection["SessionTimeoutMs"] ?? "6000");
    });
}

var app = builder.Build();

// Auto-apply pending migrations on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<HRPortalDbContext>();
    db.Database.Migrate();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

// Configure the HTTP request pipeline.
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
