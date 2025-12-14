namespace Application.Infrastructure;

public enum OwnershipScope
{
    All = 0,
    Yours = 1
}

public static class OwnershipScopeParser
{
    public static OwnershipScope Parse(string? scope)
    {
        return scope != null && scope.Equals("yours", StringComparison.OrdinalIgnoreCase)
            ? OwnershipScope.Yours
            : OwnershipScope.All;
    }
}
