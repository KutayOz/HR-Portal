namespace Application.DTOs;

public sealed class AccessRequestDto
{
    public string Id { get; set; }
    public string ResourceType { get; set; }
    public string ResourceId { get; set; }
    public string OwnerAdminId { get; set; }
    public string RequesterAdminId { get; set; }
    public string Status { get; set; }
    public string RequestedAt { get; set; }
    public string? DecidedAt { get; set; }
    public string? AllowedUntil { get; set; }
    public string? Note { get; set; }
}

public sealed class CreateAccessRequestDto
{
    public string ResourceType { get; set; }
    public string ResourceId { get; set; }
    public string? Note { get; set; }
}

public sealed class DecideAccessRequestDto
{
    public int AllowMinutes { get; set; } = 15;
}
