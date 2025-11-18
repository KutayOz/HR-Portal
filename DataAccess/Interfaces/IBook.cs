using Common.entity;

namespace DataAccess.Interfaces
{
    public interface IBook
    {
        List<List<Book>> GetAllBooks();
        List<Book> GetBookById(int id);
        List<Book> GetBooksByCategory(int categoryId);
        List<Book> getBookByAuthor(int AuthorId);
        Task AddBookAsync(Book book);
        Task UpdateBookAsync(Book book);
        Task DeleteBookAsync(int id);
    }
}