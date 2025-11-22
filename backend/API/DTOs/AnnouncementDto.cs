namespace API.DTOs
{
    public class AnnouncementDto
    {
        public string Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Priority { get; set; }
        public string ExpiryDate { get; set; }
    }
}
