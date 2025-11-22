namespace API.DTOs
{
    public class CreateEmployeeDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string DateOfBirth { get; set; }
        public string HireDate { get; set; }
        public int DepartmentId { get; set; }
        public int JobId { get; set; }
        public int? ManagerId { get; set; }
        public decimal CurrentSalary { get; set; }
        public string EmploymentStatus { get; set; } = "Active";
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
    }

    public class UpdateEmployeeDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public int DepartmentId { get; set; }
        public int JobId { get; set; }
        public int? ManagerId { get; set; }
        public decimal CurrentSalary { get; set; }
        public string EmploymentStatus { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
    }
}
