using Application.Infrastructure;

namespace API.Infrastructure;

public sealed class HeaderCurrentAdminProvider : ICurrentAdminProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HeaderCurrentAdminProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? AdminId => _httpContextAccessor.HttpContext == null
        ? null
        : AdminContext.GetAdminId(_httpContextAccessor.HttpContext);
}
