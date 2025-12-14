using Data.Context;
using DataAccess.Repository;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Common.Entity;

namespace DataAccess.IntegrationTests;

public class CandidateRepositoryTests
{
    [Fact]
    public async Task CandidateRepository_CRUD_WorksAgainstSqliteInMemory()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<HRPortalDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var context = new HRPortalDbContext(options);
        await context.Database.EnsureCreatedAsync();

        var repo = new CandidateRepository(context);

        var candidate = new Candidate
        {
            FirstName = "Jane",
            LastName = "Doe",
            Email = "jane.doe@example.com",
            PhoneNumber = "555",
            Address = string.Empty,
            City = string.Empty,
            State = string.Empty,
            PostalCode = string.Empty,
            Country = string.Empty,
            ResumePath = string.Empty,
            LinkedInProfile = string.Empty,
            CurrentCompany = string.Empty,
            CurrentPosition = string.Empty,
            Skills = string.Empty,
            HighestEducation = string.Empty,
            CreatedAt = DateTime.UtcNow,
            JobApplications = new List<JobApplication>()
        };

        await repo.AddAsync(candidate);
        await repo.SaveChangesAsync();

        Assert.True(await repo.EmailExistsAsync("jane.doe@example.com"));

        var all = await repo.GetAllAsync();
        Assert.Single(all);

        var found = await repo.FindByIdAsync(candidate.CandidateId);
        Assert.NotNull(found);
        Assert.Equal("Jane", found!.FirstName);

        repo.Remove(found);
        await repo.SaveChangesAsync();

        var afterDelete = await repo.GetAllAsync();
        Assert.Empty(afterDelete);
    }
}
