using Application.Kafka;
using Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAccessRequestService, AccessRequestService>();
        services.AddScoped<IDepartmentService, DepartmentService>();
        services.AddScoped<IJobService, JobService>();
        services.AddScoped<IAnnouncementService, AnnouncementService>();
        services.AddScoped<ICandidateService, CandidateService>();
        services.AddScoped<IJobApplicationService, JobApplicationService>();
        services.AddScoped<IEmployeeService, EmployeeService>();
        services.AddScoped<ILeaveRequestService, LeaveRequestService>();
        services.AddScoped<IAttendanceRecordService, AttendanceRecordService>();
        services.AddScoped<ICompensationChangeService, CompensationChangeService>();
        services.AddScoped<IEmploymentContractService, EmploymentContractService>();
        services.AddScoped<IHealthService, HealthService>();

        return services;
    }

    public static IServiceCollection AddKafka(this IServiceCollection services, Action<KafkaSettings> configureSettings)
    {
        services.Configure(configureSettings);
        services.AddSingleton<IKafkaProducer, KafkaProducer>();
        services.AddHostedService<KafkaConsumerService>();

        return services;
    }
}
