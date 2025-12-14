namespace Application.DTOs
{
    public class EmployeeDto
    {
        public string Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string DepartmentId { get; set; }
        public string DepartmentName { get; set; }
        public string JobTitle { get; set; }
        public string? ManagerId { get; set; }
        public string Status { get; set; }
        public decimal CurrentSalary { get; set; }
        public string HireDate { get; set; }
        public string? TerminationDate { get; set; }
        public string AvatarUrl { get; set; }
        public List<string> Skills { get; set; }
        public string? OwnerAdminId { get; set; }
    }
}
