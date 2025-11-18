# HR Portal Backend

A comprehensive HR Management System backend built with C# .NET 10 and PostgreSQL 16.

## Architecture

The project follows a layered architecture:

- **Common** - Entity models and shared components
- **Data** - Database context and migrations
- **DataAccess** - Data access layer (repositories and services)
- **API** - RESTful API endpoints

## Database Entities

The system includes the following entities:

### 1. **Department**
- DepartmentId (PK)
- DepartmentName (unique)
- Description
- CreatedAt, UpdatedAt

### 2. **Job**
- JobId (PK)
- JobTitle
- JobDescription
- MinSalary, MaxSalary
- DepartmentId (FK)
- IsActive
- CreatedAt, UpdatedAt

### 3. **Employee**
- EmployeeId (PK)
- FirstName, LastName
- Email (unique)
- PhoneNumber
- DateOfBirth, HireDate, TerminationDate
- DepartmentId (FK), JobId (FK), ManagerId (FK - self-referencing)
- CurrentSalary
- EmploymentStatus (Active, Terminated, OnLeave, Suspended)
- Address details (Address, City, State, PostalCode, Country)
- CreatedAt, UpdatedAt

### 4. **LeaveRequest**
- LeaveRequestId (PK)
- EmployeeId (FK)
- LeaveType (Annual, Sick, Unpaid, Maternity, Paternity, etc.)
- StartDate, EndDate, NumberOfDays
- Reason
- Status (Pending, Approved, Rejected, Cancelled)
- ApprovedBy, ApprovedDate, ApproverComments
- CreatedAt, UpdatedAt

### 5. **AttendanceRecord**
- AttendanceRecordId (PK)
- EmployeeId (FK)
- Date (unique per employee)
- CheckInTime, CheckOutTime, TotalHours
- Status (Present, Absent, Late, HalfDay, OnLeave)
- Remarks
- CreatedAt, UpdatedAt

### 6. **EmploymentContract**
- ContractId (PK)
- EmployeeId (FK)
- ContractType (FullTime, PartTime, Contract, Temporary, Internship)
- StartDate, EndDate
- Salary, Currency, PaymentFrequency
- WorkingHoursPerWeek
- Terms, DocumentPath
- IsActive
- CreatedAt, UpdatedAt

### 7. **Candidate**
- CandidateId (PK)
- FirstName, LastName
- Email (unique)
- PhoneNumber
- Address details
- ResumePath, LinkedInProfile
- CurrentCompany, CurrentPosition
- YearsOfExperience, Skills
- HighestEducation
- CreatedAt, UpdatedAt

### 8. **JobApplication**
- ApplicationId (PK)
- CandidateId (FK), JobId (FK)
- ApplicationDate
- Status (Applied, UnderReview, Shortlisted, Interview, Offered, Rejected, Hired, Withdrawn)
- CoverLetter, ExpectedSalary
- InterviewDate, InterviewNotes, InterviewedBy
- RejectionReason
- CreatedAt, UpdatedAt

### 9. **Announcement**
- AnnouncementId (PK)
- Title, Content
- AnnouncementType (General, Urgent, Event, Holiday, Policy, Achievement)
- Priority (Low, Medium, High, Critical)
- CreatedBy, PublishDate, ExpiryDate
- IsActive
- TargetDepartmentId (FK - nullable, null means all departments)
- AttachmentPath
- CreatedAt, UpdatedAt

### 10. **CompensationChange**
- CompensationChangeId (PK)
- EmployeeId (FK)
- OldSalary, NewSalary
- ChangeAmount, ChangePercentage
- ChangeReason (Promotion, Annual Increase, Market Adjustment, Performance Bonus, Demotion)
- EffectiveDate
- ApprovedBy, ApprovedDate
- Comments
- CreatedAt

## Database Relationships

- **Department** → **Job** (One-to-Many)
- **Department** → **Employee** (One-to-Many)
- **Job** → **Employee** (One-to-Many)
- **Job** → **JobApplication** (One-to-Many)
- **Employee** → **Employee** (Self-referencing for Manager-Subordinate)
- **Employee** → **LeaveRequest** (One-to-Many, Cascade Delete)
- **Employee** → **AttendanceRecord** (One-to-Many, Cascade Delete)
- **Employee** → **EmploymentContract** (One-to-Many, Cascade Delete)
- **Employee** → **CompensationChange** (One-to-Many, Cascade Delete)
- **Candidate** → **JobApplication** (One-to-Many, Cascade Delete)
- **Department** → **Announcement** (Optional, SetNull on Delete)

## Technology Stack

- **.NET 10.0**
- **Entity Framework Core 10.0.0**
- **PostgreSQL 16** (via Npgsql 10.0.0-rc.2)
- **ASP.NET Core Web API**

## Project Structure

```
WebProject/
├── Common/
│   └── Entity/
│       ├── Department.cs
│       ├── Job.cs
│       ├── Employee.cs
│       ├── LeaveRequest.cs
│       ├── AttendanceRecord.cs
│       ├── EmploymentContract.cs
│       ├── Candidate.cs
│       ├── JobApplication.cs
│       ├── Announcement.cs
│       └── CompensationChange.cs
├── Data/
│   ├── Context/
│   │   ├── HRPortalDbContext.cs
│   │   └── HRPortalDbContextFactory.cs
│   └── Migrations/
│       ├── 20251118074049_InitialCreate.cs
│       ├── 20251118074049_InitialCreate.Designer.cs
│       └── HRPortalDbContextModelSnapshot.cs
├── DataAccess/
├── API/
│   ├── Program.cs
│   └── appsettings.json
└── HRPortal.sln

```

## Database Configuration

Update the connection string in `API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=HRPortalDB;Username=postgres;Password=yourpassword"
  }
}
```

Also update the connection string in `Data/Context/HRPortalDbContextFactory.cs` for migrations.

## Running Migrations

### Apply migrations to database:
```bash
dotnet ef database update --project Data/Data.csproj --startup-project API/API.csproj
```

### Create new migration:
```bash
dotnet ef migrations add MigrationName --project Data/Data.csproj --startup-project API/API.csproj
```

### Remove last migration:
```bash
dotnet ef migrations remove --project Data/Data.csproj --startup-project API/API.csproj
```

## Building and Running

### Restore dependencies:
```bash
dotnet restore
```

### Build the solution:
```bash
dotnet build
```

### Run the API:
```bash
dotnet run --project API/API.csproj
```

The API will be available at `https://localhost:5001` with Swagger UI at `https://localhost:5001/swagger`.

## Features

### Entity Features:
- ✅ Comprehensive employee management
- ✅ Department and job hierarchies
- ✅ Leave request tracking
- ✅ Attendance monitoring
- ✅ Contract management
- ✅ Recruitment and candidate tracking
- ✅ Compensation change logging
- ✅ Company announcements

### Database Features:
- ✅ Foreign key constraints
- ✅ Unique indexes on emails
- ✅ Cascade delete for dependent records
- ✅ Audit fields (CreatedAt, UpdatedAt)
- ✅ Self-referencing relationships (Manager-Subordinate)
- ✅ Proper data types for monetary values (decimal 18,2)

## Next Steps

1. **Configure PostgreSQL 16** - Ensure PostgreSQL is installed and running
2. **Update Connection Strings** - Set your database credentials
3. **Apply Migrations** - Run `dotnet ef database update`
4. **Implement Controllers** - Create API endpoints for each entity
5. **Add Authentication** - Implement JWT authentication
6. **Add Authorization** - Define role-based access control
7. **Implement Business Logic** - Add services in DataAccess layer
8. **Add Validation** - Implement FluentValidation
9. **Add Logging** - Configure Serilog
10. **Write Tests** - Unit and integration tests

## License

This project is for educational/internal use.
