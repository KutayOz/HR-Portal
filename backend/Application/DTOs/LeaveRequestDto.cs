namespace Application.DTOs
{
    public class LeaveRequestDto
    {
        public string Id { get; set; }
        public string EmployeeId { get; set; }
        public string EmployeeName { get; set; }
        public string Type { get; set; }
        public string StartDate { get; set; }
        public string EndDate { get; set; }
        public string Status { get; set; }
        public string? OwnerAdminId { get; set; }
    }
}
