using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Common.Entity
{
    public class Candidate
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int CandidateId { get; set; }

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

        [MaxLength(500)]
        public string ResumePath { get; set; }

        [MaxLength(200)]
        public string LinkedInProfile { get; set; }

        [MaxLength(100)]
        public string CurrentCompany { get; set; }

        [MaxLength(100)]
        public string CurrentPosition { get; set; }

        public int? YearsOfExperience { get; set; }

        [MaxLength(1000)]
        public string Skills { get; set; }

        [MaxLength(100)]
        public string HighestEducation { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<JobApplication> JobApplications { get; set; }
    }
}
