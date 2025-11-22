using System.ComponentModel.DataAnnotations;

namespace API.DTOs
{
    public class EmploymentContractDto
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; }
        public string ContractType { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal Salary { get; set; }
        public string Currency { get; set; }
        public string PaymentFrequency { get; set; }
        public int WorkingHoursPerWeek { get; set; }
        public string Terms { get; set; }
        public bool IsActive { get; set; }
        public string DocumentPath { get; set; }
    }

    public class CreateEmploymentContractDto
    {
        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public string ContractType { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        [Required]
        public decimal Salary { get; set; }

        public string Currency { get; set; } = "USD";

        public string PaymentFrequency { get; set; } = "Monthly";

        [Required]
        public int WorkingHoursPerWeek { get; set; }

        public string Terms { get; set; }

        public string DocumentPath { get; set; }
    }

    public class UpdateEmploymentContractDto
    {
        [Required]
        public string ContractType { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        [Required]
        public decimal Salary { get; set; }

        public string Currency { get; set; }

        public string PaymentFrequency { get; set; }

        [Required]
        public int WorkingHoursPerWeek { get; set; }

        public string Terms { get; set; }

        public bool IsActive { get; set; }

        public string DocumentPath { get; set; }
    }
}
