using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Common.Entity
{
    public class Employee
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int EmployeeId { get; set; }

        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; }

        [Required]
        [MaxLength(50)]
        public string LastName { get; set; }

        [Required]
        [MaxLength(100)]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [MaxLength(20)]
        public string PhoneNumber { get; set; }

        [Required]
        public DateTime DateOfBirth { get; set; }

        [Required]
        public DateTime HireDate { get; set; }

        public DateTime? TerminationDate { get; set; }

        [Required]
        public int DepartmentId { get; set; }

        [Required]
        public int JobId { get; set; }

        public int? ManagerId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal CurrentSalary { get; set; }

        [Required]
        [MaxLength(20)]
        public string EmploymentStatus { get; set; } // Active, Terminated, OnLeave, Suspended

        [MaxLength(200)]
        public string Address { get; set; }

        [MaxLength(50)]
        public string City { get; set; }

        [MaxLength(50)]
        public string State { get; set; }

        [MaxLength(20)]
        public string PostalCode { get; set; }

        [MaxLength(50)]
        public string Country { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey("DepartmentId")]
        public virtual Department Department { get; set; }

        [ForeignKey("JobId")]
        public virtual Job Job { get; set; }

        [ForeignKey("ManagerId")]
        public virtual Employee Manager { get; set; }

        public virtual ICollection<Employee> Subordinates { get; set; }
        public virtual ICollection<LeaveRequest> LeaveRequests { get; set; }
        public virtual ICollection<AttendanceRecord> AttendanceRecords { get; set; }
        public virtual ICollection<EmploymentContract> EmploymentContracts { get; set; }
        public virtual ICollection<CompensationChange> CompensationChanges { get; set; }
    }
}
