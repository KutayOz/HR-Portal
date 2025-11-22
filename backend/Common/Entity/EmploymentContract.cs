using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Common.Entity
{
    public class EmploymentContract
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ContractId { get; set; }

        [Required]
        public int EmployeeId { get; set; }

        [Required]
        [MaxLength(50)]
        public string ContractType { get; set; } // FullTime, PartTime, Contract, Temporary, Internship

        [Required]
        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Salary { get; set; }

        [MaxLength(3)]
        public string Currency { get; set; } = "USD";

        [MaxLength(20)]
        public string PaymentFrequency { get; set; } // Monthly, Biweekly, Weekly

        [Required]
        public int WorkingHoursPerWeek { get; set; }

        [MaxLength(1000)]
        public string Terms { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;

        [MaxLength(500)]
        public string DocumentPath { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey("EmployeeId")]
        public virtual Employee Employee { get; set; }
    }
}
