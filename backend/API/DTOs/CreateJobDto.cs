using System.ComponentModel.DataAnnotations;

namespace API.DTOs
{
    public class CreateJobDto
    {
        [Required]
        public string Title { get; set; }

        [Required]
        public string Description { get; set; }

        [Required]
        public decimal MinSalary { get; set; }

        [Required]
        public decimal MaxSalary { get; set; }

        [Required]
        public int DepartmentId { get; set; }
    }

    public class UpdateJobDto
    {
        [Required]
        public string Title { get; set; }

        [Required]
        public string Description { get; set; }

        [Required]
        public decimal MinSalary { get; set; }

        [Required]
        public decimal MaxSalary { get; set; }

        [Required]
        public bool IsActive { get; set; }
    }
}
