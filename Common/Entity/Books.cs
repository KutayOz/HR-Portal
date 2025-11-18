using System.ComponentModel.DataAnnotations;

namespace Common.Entity
{
    public class Books
    {
        [Key]
        public int BookId { get; set; }
        public string BookName { get; set; }
        public string Author { get; set; }
        public string ISBN { get; set; }
        public int PublishedYear { get; set; }
    }
}