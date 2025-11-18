using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Common.Entity
{
    public class Announcement
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AnnouncementId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Content { get; set; }

        [Required]
        [MaxLength(30)]
        public string AnnouncementType { get; set; } // General, Urgent, Event, Holiday, Policy, Achievement

        [Required]
        [MaxLength(20)]
        public string Priority { get; set; } // Low, Medium, High, Critical

        public int? CreatedBy { get; set; }

        [Required]
        public DateTime PublishDate { get; set; }

        public DateTime? ExpiryDate { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;

        public int? TargetDepartmentId { get; set; } // null means all departments

        [MaxLength(500)]
        public string AttachmentPath { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey("TargetDepartmentId")]
        public virtual Department TargetDepartment { get; set; }
    }
}
