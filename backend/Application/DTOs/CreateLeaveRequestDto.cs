namespace Application.DTOs
{
    public class CreateLeaveRequestDto
    {
        public int EmployeeId { get; set; }
        public string LeaveType { get; set; }
        public string StartDate { get; set; }
        public string EndDate { get; set; }
        public string Reason { get; set; }
    }

    public class UpdateLeaveStatusDto
    {
        public string Status { get; set; }
        public string? ApproverComments { get; set; }
    }
}
