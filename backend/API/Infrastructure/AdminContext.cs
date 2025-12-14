namespace API.Infrastructure;

public static class AdminContext
{
    public const string AdminIdHeader = "X-Admin-Id";

    public static string? GetAdminId(HttpContext httpContext)
    {
        if (httpContext.Request.Headers.TryGetValue(AdminIdHeader, out var values))
        {
            var value = values.ToString();
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value.Trim();
            }
        }

        return null;
    }
}
