using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Common.Entity
{
    public class AccessRequest
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AccessRequestId { get; set; }

        [Required]
        [MaxLength(50)]
        public string ResourceType { get; set; }

        [Required]
        public int ResourceId { get; set; }

        [Required]
        [MaxLength(100)]
        public string OwnerAdminId { get; set; }

        [Required]
        [MaxLength(100)]
        public string RequesterAdminId { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending";

        [Required]
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

        public DateTime? DecidedAt { get; set; }

        public DateTime? AllowedUntil { get; set; }

        [MaxLength(500)]
        public string? Note { get; set; }
    }
}
