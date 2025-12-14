namespace Application.DTOs
{
    public class CreateAnnouncementDto
    {
        public string Title { get; set; }
        public string Content { get; set; }
        public string AnnouncementType { get; set; } = "General";
        public string Priority { get; set; } = "Normal";
        public string? PublishDate { get; set; }
        public string? ExpiryDate { get; set; }
        public int? TargetDepartmentId { get; set; }
    }
}
