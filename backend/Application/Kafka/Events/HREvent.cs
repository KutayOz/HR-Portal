namespace Application.Kafka.Events;

public abstract class HREvent
{
    public string EventId { get; set; } = Guid.NewGuid().ToString();
    public string EventType { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? TriggeredBy { get; set; }
}

public class EmployeeCreatedEvent : HREvent
{
    public int EmployeeId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }

    public EmployeeCreatedEvent()
    {
        EventType = nameof(EmployeeCreatedEvent);
    }
}

public class EmployeeUpdatedEvent : HREvent
{
    public int EmployeeId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public Dictionary<string, object?> ChangedFields { get; set; } = new();

    public EmployeeUpdatedEvent()
    {
        EventType = nameof(EmployeeUpdatedEvent);
    }
}

public class EmployeeTerminatedEvent : HREvent
{
    public int EmployeeId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public DateTime TerminationDate { get; set; }
    public string? Reason { get; set; }

    public EmployeeTerminatedEvent()
    {
        EventType = nameof(EmployeeTerminatedEvent);
    }
}

public class LeaveRequestCreatedEvent : HREvent
{
    public int LeaveRequestId { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string LeaveType { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int NumberOfDays { get; set; }

    public LeaveRequestCreatedEvent()
    {
        EventType = nameof(LeaveRequestCreatedEvent);
    }
}

public class LeaveRequestStatusChangedEvent : HREvent
{
    public int LeaveRequestId { get; set; }
    public int EmployeeId { get; set; }
    public string OldStatus { get; set; } = string.Empty;
    public string NewStatus { get; set; } = string.Empty;
    public string? ApprovedBy { get; set; }

    public LeaveRequestStatusChangedEvent()
    {
        EventType = nameof(LeaveRequestStatusChangedEvent);
    }
}

public class DepartmentCreatedEvent : HREvent
{
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;

    public DepartmentCreatedEvent()
    {
        EventType = nameof(DepartmentCreatedEvent);
    }
}

public class CandidateHiredEvent : HREvent
{
    public int CandidateId { get; set; }
    public int EmployeeId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public int JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;

    public CandidateHiredEvent()
    {
        EventType = nameof(CandidateHiredEvent);
    }
}
