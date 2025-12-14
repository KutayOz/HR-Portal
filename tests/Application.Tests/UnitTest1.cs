using Application.DTOs;
using Application.Infrastructure;
using Application.Repositories;
using Application.Services;
using Common.Entity;
using Microsoft.Extensions.Logging;
using Moq;

namespace Application.Tests;

public class CandidateServiceTests
{
    [Fact]
    public async Task DeleteCandidateAsync_WhenCandidateDoesNotExist_ReturnsNotFound()
    {
        var candidateRepository = new Mock<ICandidateRepository>();
        candidateRepository
            .Setup(r => r.FindByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Candidate?)null);

        var jobApplicationRepository = new Mock<IJobApplicationRepository>();
        var accessRequestRepository = new Mock<IAccessRequestRepository>();
        var currentAdminProvider = new Mock<ICurrentAdminProvider>();

        var logger = new Mock<ILogger<CandidateService>>();
        var service = new CandidateService(
            candidateRepository.Object,
            jobApplicationRepository.Object,
            accessRequestRepository.Object,
            currentAdminProvider.Object,
            logger.Object);

        var (success, errorMessage, notFound) = await service.DeleteCandidateAsync(123);

        Assert.False(success);
        Assert.Null(errorMessage);
        Assert.True(notFound);
    }

    [Fact]
    public async Task DeleteCandidateAsync_WhenCandidateHasApplications_RemovesApplicationsAndCandidate()
    {
        var candidate = new Candidate
        {
            CandidateId = 1,
            FirstName = "A",
            LastName = "B",
            Email = "a@b.com",
            PhoneNumber = "000",
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
            OwnerAdminId = "admin01",
            JobApplications = new List<JobApplication>()
        };

        var applications = new List<JobApplication>
        {
            new()
            {
                ApplicationId = 10,
                CandidateId = 1,
                JobId = 1,
                Status = "Applied",
                CoverLetter = string.Empty,
                InterviewNotes = string.Empty,
                RejectionReason = string.Empty,
                CreatedAt = DateTime.UtcNow,
                Candidate = candidate,
                Job = new Job
                {
                    JobId = 1,
                    JobTitle = "Dev",
                    JobDescription = "Desc",
                    MinSalary = 1,
                    MaxSalary = 2,
                    DepartmentId = 1,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    Department = new Department
                    {
                        DepartmentId = 1,
                        DepartmentName = "IT",
                        Description = string.Empty,
                        CreatedAt = DateTime.UtcNow,
                        Employees = new List<Employee>(),
                        Jobs = new List<Job>()
                    },
                    Employees = new List<Employee>(),
                    JobApplications = new List<JobApplication>()
                }
            }
        };

        var candidateRepository = new Mock<ICandidateRepository>();
        candidateRepository
            .Setup(r => r.FindByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(candidate);

        var jobApplicationRepository = new Mock<IJobApplicationRepository>();
        jobApplicationRepository
            .Setup(r => r.GetByCandidateIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(applications);

        var accessRequestRepository = new Mock<IAccessRequestRepository>();
        var currentAdminProvider = new Mock<ICurrentAdminProvider>();
        currentAdminProvider.SetupGet(p => p.AdminId).Returns("admin01");

        var logger = new Mock<ILogger<CandidateService>>();
        var service = new CandidateService(
            candidateRepository.Object,
            jobApplicationRepository.Object,
            accessRequestRepository.Object,
            currentAdminProvider.Object,
            logger.Object);

        var (success, errorMessage, notFound) = await service.DeleteCandidateAsync(1);

        Assert.True(success);
        Assert.Null(errorMessage);
        Assert.False(notFound);

        jobApplicationRepository.Verify(r => r.RemoveRange(It.IsAny<IEnumerable<JobApplication>>()), Times.Once);
        candidateRepository.Verify(r => r.Remove(It.IsAny<Candidate>()), Times.Once);
        candidateRepository.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateCandidateAsync_WhenEmailExists_ReturnsError()
    {
        var candidateRepository = new Mock<ICandidateRepository>();
        candidateRepository
            .Setup(r => r.EmailExistsAsync("exists@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var jobApplicationRepository = new Mock<IJobApplicationRepository>();
        var accessRequestRepository = new Mock<IAccessRequestRepository>();
        var currentAdminProvider = new Mock<ICurrentAdminProvider>();
        var logger = new Mock<ILogger<CandidateService>>();
        var service = new CandidateService(
            candidateRepository.Object,
            jobApplicationRepository.Object,
            accessRequestRepository.Object,
            currentAdminProvider.Object,
            logger.Object);

        var dto = new CreateCandidateDto
        {
            FirstName = "A",
            LastName = "B",
            Email = "exists@example.com",
            PhoneNumber = "000"
        };

        var (result, errorMessage) = await service.CreateCandidateAsync(dto);

        Assert.Null(result);
        Assert.Equal("Email already exists", errorMessage);
        candidateRepository.Verify(r => r.AddAsync(It.IsAny<Candidate>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
