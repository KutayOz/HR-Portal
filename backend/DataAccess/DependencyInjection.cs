using DataAccess.Repository;
using Microsoft.Extensions.DependencyInjection;

namespace DataAccess;

public static class DependencyInjection
{
    public static IServiceCollection AddDataAccess(this IServiceCollection services)
    {
        services.AddScoped<Application.Repositories.IAccessRequestRepository, AccessRequestRepository>();
        services.AddScoped<Application.Repositories.IDepartmentRepository, DepartmentRepository>();
        services.AddScoped<Application.Repositories.IJobRepository, JobRepository>();
        services.AddScoped<Application.Repositories.IAnnouncementRepository, AnnouncementRepository>();
        services.AddScoped<Application.Repositories.ICandidateRepository, CandidateRepository>();
        services.AddScoped<Application.Repositories.IJobApplicationRepository, JobApplicationRepository>();
        services.AddScoped<Application.Repositories.IEmployeeRepository, EmployeeRepository>();
        services.AddScoped<Application.Repositories.ILeaveRequestRepository, LeaveRequestRepository>();
        services.AddScoped<Application.Repositories.IAttendanceRecordRepository, AttendanceRecordRepository>();
        services.AddScoped<Application.Repositories.ICompensationChangeRepository, CompensationChangeRepository>();
        services.AddScoped<Application.Repositories.IEmploymentContractRepository, EmploymentContractRepository>();
        services.AddScoped<Application.Repositories.IHealthCheckRepository, HealthCheckRepository>();

        return services;
    }
}
