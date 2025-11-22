namespace API.DTOs
{
    public class CreateJobApplicationDto
    {
        public int CandidateId { get; set; }
        public int JobId { get; set; }
        public string? InterviewNotes { get; set; }
        public decimal? ExpectedSalary { get; set; }
    }

    public class UpdateJobApplicationDto
    {
        public string Status { get; set; } // Applied, Interview, Offered, Hired, Rejected
        public string? InterviewNotes { get; set; }
    }

    public class CreateCandidateDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Skills { get; set; } // Comma-separated
        public string? LinkedInProfile { get; set; }
        public string? ResumePath { get; set; }
        public int? YearsOfExperience { get; set; }
    }
}
