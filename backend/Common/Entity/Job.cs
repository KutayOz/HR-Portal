using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Common.Entity
{
    public class Job
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int JobId { get; set; }

        [Required]
        [MaxLength(150)]
        public string JobTitle { get; set; }

        [Required]
        [MaxLength(1000)]
        public string JobDescription { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal MinSalary { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal MaxSalary { get; set; }

        [Required]
        public int DepartmentId { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey("DepartmentId")]
        public virtual Department Department { get; set; }
        public virtual ICollection<Employee> Employees { get; set; }
        public virtual ICollection<JobApplication> JobApplications { get; set; }
    }
}
