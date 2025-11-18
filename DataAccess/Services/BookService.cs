using DataAcess.Interfaces;

public class BookService : IBook
{
    public readonly LibManDbContext _context;
    private DbSet<Book> _books;

    public BookService()
    {
        _context = new LibManDbContext();
        _books = _context.Set<Book>(); // DbSet<Book> initialization
    }

    // Buraya tüm IBook interface'indeki metodların implementasyonları gelecek
}
