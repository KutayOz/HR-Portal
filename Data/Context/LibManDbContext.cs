using Microsoft.EntityFrameworkCore;
using Data.Dependencies.Context.Entities;

namespace Data.Context
{
    public class LibManDbContext : DbContext
    {
        //Burada Database bağlantı ayarları yapılır
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                // Example configuration, replace with actual connection string
                optionsBuilder.UseNpgsql("YourConnectionStringHere");
            }
        }

        // Database olarak postgreSQL kullanılıyor
        // Auto-migration kullanarak da yapabilirsiniz. Database oluştur ve otomatik migrate et.

        //Tüm entity'ler burada DbSet olarak tanımlanır
        public DbSet<Book> Books { get; set; }
        public DbSet<Admins> Admins { get; set; }
        public DbSet<Returns> Returns { get; set; }
        public DbSet<Category> Category { get; set; }
        public DbSet<Users> Users { get; set; }
        public DbSet<Barrowing> Barrowing { get; set; }
        public DbSet<Shelf> Shelf { get; set; }

        // Eğer Data'yı farklı amaçlarla kullanacaksanız Dto'lar oluşturmanız gerekir.

    }
}