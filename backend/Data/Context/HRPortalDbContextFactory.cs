using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Data.Context
{
    public class HRPortalDbContextFactory : IDesignTimeDbContextFactory<HRPortalDbContext>
    {
        public HRPortalDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<HRPortalDbContext>();
            optionsBuilder.UseNpgsql(
                "Host=localhost;Port=5432;Database=HRPortalDB;Username=kutinyo;Password=Kutay123",
                npgsqlOptions => npgsqlOptions.MigrationsAssembly("Data")
            );

            return new HRPortalDbContext(optionsBuilder.Options);
        }
    }
}
