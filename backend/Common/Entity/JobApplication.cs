using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Common.Entity
{
    public class JobApplication
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ApplicationId { get; set; }

        [Required]
        public int CandidateId { get; set; }

        [Required]
        public int JobId { get; set; }

        [Required]
        public DateTime ApplicationDate { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } // Applied, UnderReview, Shortlisted, Interview, Offered, Rejected, Hired, Withdrawn

        [MaxLength(500)]
        public string CoverLetter { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? ExpectedSalary { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? OfferedSalary { get; set; }

        public DateTime? InterviewDate { get; set; }

        [MaxLength(1000)]
        public string InterviewNotes { get; set; }

        public int? InterviewedBy { get; set; }

        [MaxLength(1000)]
        public string RejectionReason { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(100)]
        public string? OwnerAdminId { get; set; }

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey("CandidateId")]
        public virtual Candidate Candidate { get; set; }

        [ForeignKey("JobId")]
        public virtual Job Job { get; set; }
    }
}
