using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Common.Entity
{
    public class CompensationChange
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int CompensationChangeId { get; set; }

        [Required]
        public int EmployeeId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal OldSalary { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal NewSalary { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal ChangeAmount { get; set; }

        [Required]
        [Column(TypeName = "decimal(5,2)")]
        public decimal ChangePercentage { get; set; }

        [Required]
        [MaxLength(50)]
        public string ChangeReason { get; set; } // Promotion, Annual Increase, Market Adjustment, Performance Bonus, Demotion

        [Required]
        public DateTime EffectiveDate { get; set; }

        public int? ApprovedBy { get; set; }

        public DateTime? ApprovedDate { get; set; }

        [MaxLength(1000)]
        public string Comments { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("EmployeeId")]
        public virtual Employee Employee { get; set; }
    }
}
