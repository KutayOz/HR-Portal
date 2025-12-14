namespace Application.DTOs;

public class AdminDelegationDto
{
    public int Id { get; set; }
    public string FromAdminId { get; set; } = string.Empty;
    public string ToAdminId { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateDelegationDto
{
    public string ToAdminId { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? Reason { get; set; }
}
