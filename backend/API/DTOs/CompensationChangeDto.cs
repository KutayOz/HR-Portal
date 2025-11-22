using System.ComponentModel.DataAnnotations;

namespace API.DTOs
{
    public class CompensationChangeDto
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; }
        public decimal OldSalary { get; set; }
        public decimal NewSalary { get; set; }
        public decimal ChangeAmount { get; set; }
        public decimal ChangePercentage { get; set; }
        public string ChangeReason { get; set; }
        public DateTime EffectiveDate { get; set; }
        public int? ApprovedBy { get; set; }
        public DateTime? ApprovedDate { get; set; }
        public string Comments { get; set; }
    }

    public class CreateCompensationChangeDto
    {
        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public decimal OldSalary { get; set; }

        [Required]
        public decimal NewSalary { get; set; }

        [Required]
        public string ChangeReason { get; set; }

        [Required]
        public DateTime EffectiveDate { get; set; }

        public int? ApprovedBy { get; set; }

        public string Comments { get; set; }
    }

    public class UpdateCompensationChangeDto
    {
        [Required]
        public decimal OldSalary { get; set; }

        [Required]
        public decimal NewSalary { get; set; }

        [Required]
        public string ChangeReason { get; set; }

        [Required]
        public DateTime EffectiveDate { get; set; }

        public int? ApprovedBy { get; set; }

        public string Comments { get; set; }
    }
}
