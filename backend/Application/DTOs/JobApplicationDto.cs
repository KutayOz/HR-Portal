namespace Application.DTOs
{
    public class JobApplicationDto
    {
        public string Id { get; set; }
        public string CandidateId { get; set; }
        public CandidateDto Candidate { get; set; }
        public string Position { get; set; }
        public string DepartmentId { get; set; }
        public string Status { get; set; }
        public string? InterviewNotes { get; set; }
        public decimal ExpectedSalary { get; set; }
        public decimal? OfferedSalary { get; set; }
        public int JobId { get; set; }
        public int MatchScore { get; set; }
        public string? OwnerAdminId { get; set; }
    }

    public class CandidateDto
    {
        public string Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string? PhoneNumber { get; set; }
        public List<string> Skills { get; set; }
        public string LinkedInUrl { get; set; }
        public string ResumeUrl { get; set; }
        public string AvatarUrl { get; set; }
        public string? OwnerAdminId { get; set; }
    }
}
