using System.Net;
using System.Text.Json;
using Application.Exceptions;

namespace API.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger, IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);

            if (context.Response.HasStarted)
            {
                throw;
            }

            var (statusCode, message) = MapException(ex);

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = statusCode;

            var payload = new
            {
                message,
                error = _environment.IsDevelopment() ? ex.ToString() : ex.Message,
                traceId = context.TraceIdentifier
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(payload, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            }));
        }
    }

    private static (int StatusCode, string Message) MapException(Exception ex)
    {
        return ex switch
        {
            ArgumentException => ((int)HttpStatusCode.BadRequest, ex.Message),
            FormatException => ((int)HttpStatusCode.BadRequest, ex.Message),
            KeyNotFoundException => ((int)HttpStatusCode.NotFound, ex.Message),
            UnauthorizedAccessException => ((int)HttpStatusCode.Unauthorized, ex.Message),
            ForbiddenException => ((int)HttpStatusCode.Forbidden, ex.Message),
            _ => ((int)HttpStatusCode.InternalServerError, "Internal server error")
        };
    }
}
