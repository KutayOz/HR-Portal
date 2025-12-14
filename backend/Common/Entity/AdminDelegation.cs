using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Common.Entity
{
    public class AdminDelegation
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int DelegationId { get; set; }

        [Required]
        [MaxLength(100)]
        public string FromAdminId { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string ToAdminId { get; set; } = string.Empty;

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Active"; // Active, Expired, Revoked

        [MaxLength(500)]
        public string? Reason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? RevokedAt { get; set; }
    }
}
