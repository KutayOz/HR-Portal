using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Common.Entity
{
    public class AttendanceRecord
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AttendanceRecordId { get; set; }

        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required]
        public TimeSpan CheckInTime { get; set; }

        public TimeSpan? CheckOutTime { get; set; }

        public TimeSpan? TotalHours { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } // Present, Absent, Late, HalfDay, OnLeave

        [MaxLength(500)]
        public string Remarks { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey("EmployeeId")]
        public virtual Employee Employee { get; set; }
    }
}
