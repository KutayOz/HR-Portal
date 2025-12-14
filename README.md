# HR Portal - Full Stack HR Management System

A comprehensive HR Management System with a **C# .NET 8 Backend** and **React TypeScript Frontend**, following Clean Architecture principles with SOLID design patterns and Dependency Injection.

---

## 🐳 Quick Start with Docker

The fastest way to run the entire application:

```bash
# Clone and navigate to project
cd WebProject

# Start all services (backend, frontend, postgres, kafka)
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

**Access the application:**
- **Frontend:** http://localhost (port 80)
- **Backend API:** http://localhost:5001
- **Swagger UI:** http://localhost:5001/swagger

### Docker Services

| Service | Port | Description |
|---------|------|-------------|
| `frontend` | 80 | React app (nginx) |
| `backend` | 5001 | .NET 8 API |
| `postgres` | 5432 | PostgreSQL 16 |
| `kafka` | 9092 | Apache Kafka |

### Development Mode (Infrastructure Only)

Run only PostgreSQL and Kafka, develop backend/frontend locally:

```bash
# Start only infrastructure
docker compose -f docker-compose.dev.yml up -d

# Then run backend and frontend manually
cd backend && dotnet run --project API
cd frontend && npm run dev
```

### Docker Commands

```bash
# Rebuild after code changes
docker compose up -d --build

# View specific service logs
docker compose logs -f backend

# Stop and remove volumes (clean slate)
docker compose down -v

# Check service health
docker compose ps
```

---

## 🏗️ Architecture Overview

The project follows **Clean Architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                    (React + TypeScript)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  features/    components/    services/    types.ts      │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST API
┌────────────────────────────▼────────────────────────────────────┐
│                          BACKEND                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      API Layer                           │  │
│  │   Controllers  │  Middleware  │  Infrastructure          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────▼───────────────────────────────┐  │
│  │                  Application Layer                       │  │
│  │   Services (I*Service)  │  DTOs  │  Repositories (I*)    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────▼───────────────────────────────┐  │
│  │                   DataAccess Layer                       │  │
│  │              Repository Implementations                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────▼───────────────────────────────┐  │
│  │                    Data Layer                            │  │
│  │           DbContext  │  Migrations                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────▼───────────────────────────────┐  │
│  │                   Common Layer                           │  │
│  │                 Entity Models                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Layers

| Layer | Project | Responsibility |
|-------|---------|----------------|
| **Common** | `Common/` | Entity models, shared enums |
| **Data** | `Data/` | DbContext, EF Core migrations |
| **DataAccess** | `DataAccess/` | Repository implementations |
| **Application** | `Application/` | Service interfaces/implementations, DTOs, Repository interfaces |
| **API** | `API/` | Controllers, Middleware, DI configuration |

### Frontend Structure

| Folder | Responsibility |
|--------|----------------|
| `features/` | Page components (Dashboard, Employees, Departments, etc.) |
| `components/` | Reusable UI components (GlassCard, NeonButton, etc.) |
| `services/` | API client functions |
| `types.ts` | TypeScript interfaces |

---

## 🎯 SOLID Principles Implementation

### 1. Single Responsibility Principle (SRP)

Her sınıf yalnızca tek bir sorumluluğa sahiptir:

```csharp
// ✅ Controller: Sadece HTTP request/response yönetimi
public class DepartmentsController : ControllerBase
{
    private readonly IDepartmentService _departmentService;
    
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DepartmentDto>>> GetDepartments()
        => Ok(await _departmentService.GetDepartmentsAsync());
}

// ✅ Service: Sadece iş mantığı
public class DepartmentService : IDepartmentService
{
    private readonly IDepartmentRepository _repository;
    
    public async Task<List<DepartmentDto>> GetDepartmentsAsync()
    {
        var departments = await _repository.GetAllWithJobsAsync();
        return departments.Select(MapToDto).ToList();
    }
}

// ✅ Repository: Sadece veri erişimi
public class DepartmentRepository : IDepartmentRepository
{
    private readonly HRPortalDbContext _context;
    
    public async Task<List<Department>> GetAllWithJobsAsync()
        => await _context.Departments.Include(d => d.Jobs).ToListAsync();
}
```

**Uygulama Örnekleri:**
- `API/Controllers/` → HTTP isteklerini yönetir
- `Application/Services/` → İş mantığını içerir
- `DataAccess/Repository/` → Veritabanı işlemlerini yönetir
- `API/Middleware/ExceptionHandlingMiddleware.cs` → Hata yönetimi

---

### 2. Open/Closed Principle (OCP)

Sınıflar genişletmeye açık, değişikliğe kapalıdır:

```csharp
// ✅ ExceptionHandlingMiddleware: Yeni exception türleri eklenebilir
private static (int StatusCode, string Message) MapException(Exception ex)
{
    return ex switch
    {
        ArgumentException => (400, ex.Message),
        KeyNotFoundException => (404, ex.Message),
        ForbiddenException => (403, ex.Message),  // Yeni eklenen
        _ => (500, "Internal server error")
    };
}
```

**Uygulama Örnekleri:**
- `Application/Exceptions/ForbiddenException.cs` → Yeni exception türleri eklenebilir
- Service'lerde yeni scope'lar (`OwnershipScope.All`, `OwnershipScope.Yours`)

---

### 3. Liskov Substitution Principle (LSP)

Alt sınıflar, üst sınıfların yerine kullanılabilir:

```csharp
// Interface
public interface IDepartmentRepository
{
    Task<List<Department>> GetAllWithJobsAsync();
    Task AddAsync(Department department);
}

// Implementation - Interface'in yerine geçebilir
public class DepartmentRepository : IDepartmentRepository
{
    public async Task<List<Department>> GetAllWithJobsAsync() { ... }
    public async Task AddAsync(Department department) { ... }
}
```

**Uygulama Örnekleri:**
- Tüm `I*Repository` → `*Repository` implementasyonları
- Tüm `I*Service` → `*Service` implementasyonları
- `ICurrentAdminProvider` → `HeaderCurrentAdminProvider`

---

### 4. Interface Segregation Principle (ISP)

Arayüzler küçük ve spesifik tutulmuştur:

```csharp
// ✅ Küçük, odaklı interface'ler
public interface ICurrentAdminProvider
{
    string? AdminId { get; }  // Sadece gerekli olan
}

public interface IHealthService
{
    Task<bool> CheckDatabaseAsync();  // Tek sorumluluk
}

public interface IDepartmentService
{
    Task<List<DepartmentDto>> GetDepartmentsAsync(OwnershipScope scope);
    Task<DepartmentDto?> GetDepartmentAsync(string id);
    Task<(DepartmentDto? Result, string? ErrorMessage)> CreateDepartmentAsync(CreateDepartmentDto dto);
    Task<(DepartmentDto? Result, string? ErrorMessage, bool NotFound)> UpdateDepartmentAsync(string id, UpdateDepartmentDto dto);
    Task<(bool Success, string? ErrorMessage, bool NotFound)> DeleteDepartmentAsync(string id);
}
```

**Uygulama Örnekleri:**
- `Application/Services/I*.cs` → Her service kendi interface'ine sahip
- `Application/Repositories/I*.cs` → Her repository kendi interface'ine sahip

---

### 5. Dependency Inversion Principle (DIP)

Üst seviye modüller alt seviye modüllere değil, soyutlamalara bağımlıdır:

```csharp
// ✅ Controller, somut Service'e değil, Interface'e bağımlı
public class DepartmentsController : ControllerBase
{
    private readonly IDepartmentService _departmentService;  // Interface!
    
    public DepartmentsController(IDepartmentService departmentService)
    {
        _departmentService = departmentService;
    }
}

// ✅ Service, somut Repository'ye değil, Interface'e bağımlı
public class DepartmentService : IDepartmentService
{
    private readonly IDepartmentRepository _repository;  // Interface!
    private readonly ICurrentAdminProvider _currentAdminProvider;  // Interface!
    
    public DepartmentService(
        IDepartmentRepository repository,
        ICurrentAdminProvider currentAdminProvider)
    {
        _repository = repository;
        _currentAdminProvider = currentAdminProvider;
    }
}
```

---

## 💉 Dependency Injection (DI) Kullanımı

### DI Registration Yapısı

Proje, modüler DI registration pattern kullanır:

#### 1. DataAccess Layer DI (`DataAccess/DependencyInjection.cs`)

```csharp
public static class DependencyInjection
{
    public static IServiceCollection AddDataAccess(this IServiceCollection services)
    {
        // Repository'leri Interface → Implementation olarak kaydet
        services.AddScoped<IDepartmentRepository, DepartmentRepository>();
        services.AddScoped<IEmployeeRepository, EmployeeRepository>();
        services.AddScoped<ICandidateRepository, CandidateRepository>();
        services.AddScoped<IJobApplicationRepository, JobApplicationRepository>();
        services.AddScoped<ILeaveRequestRepository, LeaveRequestRepository>();
        services.AddScoped<IAccessRequestRepository, AccessRequestRepository>();
        // ... diğer repository'ler

        return services;
    }
}
```

#### 2. Application Layer DI (`Application/DependencyInjection.cs`)

```csharp
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Service'leri Interface → Implementation olarak kaydet
        services.AddScoped<IDepartmentService, DepartmentService>();
        services.AddScoped<IEmployeeService, EmployeeService>();
        services.AddScoped<ICandidateService, CandidateService>();
        services.AddScoped<IJobApplicationService, JobApplicationService>();
        services.AddScoped<ILeaveRequestService, LeaveRequestService>();
        services.AddScoped<IAccessRequestService, AccessRequestService>();
        // ... diğer service'ler

        return services;
    }
}
```

#### 3. API Layer DI (`API/Program.cs`)

```csharp
var builder = WebApplication.CreateBuilder(args);

// DbContext registration
builder.Services.AddDbContext<HRPortalDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Infrastructure services
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentAdminProvider, HeaderCurrentAdminProvider>();

// Modular DI registration - Clean Architecture
builder.Services.AddDataAccess();   // Repository'ler
builder.Services.AddApplication();  // Service'ler
```

### Service Lifetime'lar

| Lifetime | Kullanım | Örnek |
|----------|----------|-------|
| **Scoped** | Her HTTP request için yeni instance | Services, Repositories |
| **Singleton** | Uygulama boyunca tek instance | - |
| **Transient** | Her injection için yeni instance | - |

### Constructor Injection Örnekleri

```csharp
// Controller'da Service injection
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;
    private readonly ILogger<EmployeesController> _logger;

    public EmployeesController(
        IEmployeeService employeeService,
        ILogger<EmployeesController> logger)
    {
        _employeeService = employeeService;
        _logger = logger;
    }
}

// Service'de Repository + Provider injection
public class EmployeeService : IEmployeeService
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IDepartmentRepository _departmentRepository;
    private readonly IAccessRequestRepository _accessRequestRepository;
    private readonly ICurrentAdminProvider _currentAdminProvider;

    public EmployeeService(
        IEmployeeRepository employeeRepository,
        IDepartmentRepository departmentRepository,
        IAccessRequestRepository accessRequestRepository,
        ICurrentAdminProvider currentAdminProvider)
    {
        _employeeRepository = employeeRepository;
        _departmentRepository = departmentRepository;
        _accessRequestRepository = accessRequestRepository;
        _currentAdminProvider = currentAdminProvider;
    }
}
```

---

## 📊 Database Entities

### Core Entities

| Entity | Description | Ownership |
|--------|-------------|-----------|
| **Department** | Departmanlar ve pozisyonlar | ✅ OwnerAdminId |
| **Employee** | Çalışan bilgileri | ✅ OwnerAdminId |
| **Job** | İş pozisyonları | - |
| **LeaveRequest** | İzin talepleri | ✅ OwnerAdminId |
| **AttendanceRecord** | Devam kayıtları | - |
| **EmploymentContract** | İş sözleşmeleri | - |
| **Candidate** | Aday bilgileri | ✅ OwnerAdminId |
| **JobApplication** | İş başvuruları | ✅ OwnerAdminId |
| **Announcement** | Duyurular | - |
| **CompensationChange** | Maaş değişiklikleri | - |
| **AccessRequest** | Erişim izin talepleri | - |
| **AdminDelegation** | Yetki devri kayıtları | - |

### Access Control System

```
┌─────────────────────────────────────────────────────────────┐
│                    Ownership Model                          │
├─────────────────────────────────────────────────────────────┤
│  Admin A creates Department → OwnerAdminId = "admin_a"     │
│  Admin B wants to edit → AccessRequest created             │
│  Admin A approves → Admin B gets temporary access          │
└─────────────────────────────────────────────────────────────┘
```

---

## � Apache Kafka Integration

Proje, event-driven architecture için **Apache Kafka** entegrasyonu içerir.

### Kafka Topics

| Topic | Description |
|-------|-------------|
| `hr-portal.employee-events` | Employee CRUD olayları |
| `hr-portal.leave-events` | İzin talep olayları |
| `hr-portal.recruitment-events` | İşe alım olayları |
| `hr-portal.department-events` | Departman olayları |
| `hr-portal.audit-events` | Audit log olayları |

### Event Types

```csharp
// Employee Events
EmployeeCreatedEvent    // Yeni çalışan oluşturulduğunda
EmployeeUpdatedEvent    // Çalışan güncellendiğinde
EmployeeTerminatedEvent // Çalışan işten ayrıldığında

// Leave Events
LeaveRequestCreatedEvent       // İzin talebi oluşturulduğunda
LeaveRequestStatusChangedEvent // İzin durumu değiştiğinde

// Recruitment Events
CandidateHiredEvent // Aday işe alındığında

// Department Events
DepartmentCreatedEvent // Departman oluşturulduğunda
```

### Kafka Configuration (`appsettings.json`)

```json
{
  "Kafka": {
    "BootstrapServers": "localhost:9092",
    "GroupId": "hr-portal-group",
    "ClientId": "hr-portal-api",
    "EnableAutoCommit": true,
    "SessionTimeoutMs": 6000
  }
}
```

### Usage Example

```csharp
// Service'de Kafka Producer kullanımı
public class EmployeeService : IEmployeeService
{
    private readonly IKafkaProducer? _kafkaProducer;

    public async Task<EmployeeDto> CreateEmployeeAsync(CreateEmployeeDto dto)
    {
        // ... employee creation logic

        // Publish event to Kafka
        if (_kafkaProducer != null)
        {
            var event = new EmployeeCreatedEvent
            {
                EmployeeId = employee.EmployeeId,
                FullName = $"{employee.FirstName} {employee.LastName}",
                Email = employee.Email,
                DepartmentId = employee.DepartmentId
            };
            await _kafkaProducer.PublishAsync(KafkaTopics.EmployeeEvents, event);
        }
    }
}
```

### Running Kafka Locally

```bash
# Docker ile Kafka başlatma
docker run -d --name kafka \
  -p 9092:9092 \
  -e KAFKA_CFG_NODE_ID=0 \
  -e KAFKA_CFG_PROCESS_ROLES=controller,broker \
  -e KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093 \
  -e KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT \
  -e KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@localhost:9093 \
  -e KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER \
  bitnami/kafka:latest
```

---

## ��️ Technology Stack

### Backend
- **.NET 8.0**
- **Entity Framework Core 10.0**
- **PostgreSQL 16** (Npgsql)
- **ASP.NET Core Web API**
- **Apache Kafka** (Confluent.Kafka)

### Frontend
- **React 18** + **TypeScript**
- **Vite** (Build tool)
- **TailwindCSS** (Styling)
- **Recharts** (Charts)
- **Framer Motion** (Animations)
- **Lucide React** (Icons)

---

## 📁 Project Structure

```
WebProject/
├── backend/
│   ├── API/
│   │   ├── Controllers/           # REST API endpoints
│   │   │   ├── DepartmentsController.cs
│   │   │   ├── EmployeesController.cs
│   │   │   ├── CandidatesController.cs
│   │   │   ├── JobApplicationsController.cs
│   │   │   ├── LeaveRequestsController.cs
│   │   │   ├── AccessRequestsController.cs
│   │   │   └── ...
│   │   ├── Middleware/
│   │   │   └── ExceptionHandlingMiddleware.cs
│   │   ├── Infrastructure/
│   │   │   ├── HeaderCurrentAdminProvider.cs
│   │   │   └── AdminContext.cs
│   │   ├── Program.cs             # DI configuration
│   │   └── appsettings.json
│   │
│   ├── Application/
│   │   ├── Services/              # Business logic
│   │   │   ├── IDepartmentService.cs
│   │   │   ├── DepartmentService.cs
│   │   │   └── ...
│   │   ├── Repositories/          # Repository interfaces
│   │   │   ├── IDepartmentRepository.cs
│   │   │   └── ...
│   │   ├── DTOs/                  # Data Transfer Objects
│   │   ├── Infrastructure/
│   │   │   └── ICurrentAdminProvider.cs
│   │   ├── Exceptions/
│   │   │   └── ForbiddenException.cs
│   │   └── DependencyInjection.cs
│   │
│   ├── DataAccess/
│   │   ├── Repository/            # Repository implementations
│   │   │   ├── DepartmentRepository.cs
│   │   │   └── ...
│   │   └── DependencyInjection.cs
│   │
│   ├── Data/
│   │   ├── Context/
│   │   │   └── HRPortalDbContext.cs
│   │   └── Migrations/
│   │
│   └── Common/
│       └── Entity/                # Domain entities
│           ├── Department.cs
│           ├── Employee.cs
│           ├── AccessRequest.cs
│           └── ...
│
├── frontend/
│   ├── features/                  # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Departments.tsx
│   │   ├── Employees.tsx
│   │   ├── Recruitment.tsx
│   │   ├── Leaves.tsx
│   │   ├── Statistics.tsx
│   │   ├── AccessRequestsModal.tsx
│   │   └── ...
│   ├── components/
│   │   └── ui/                    # Reusable UI components
│   ├── services/
│   │   └── api.ts                 # API client
│   ├── types.ts                   # TypeScript interfaces
│   ├── App.tsx
│   └── index.tsx
│
├── tests/
│   └── Application.Tests/
│
└── docs/
    └── DI_AND_SOLID.md
```

---

## 🚀 Getting Started

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- PostgreSQL 16

### Backend Setup

```bash
cd backend

# Restore dependencies
dotnet restore

# Update database
dotnet ef database update --project Data --startup-project API

# Run API
dotnet run --project API
```

API: `http://localhost:5000` | Swagger: `http://localhost:5000/swagger`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend: `http://localhost:5173`

---

## ✨ Features

### Backend Features
- ✅ RESTful API with full CRUD operations
- ✅ Clean Architecture with SOLID principles
- ✅ Dependency Injection throughout
- ✅ Global exception handling middleware
- ✅ Ownership-based access control (OwnerAdminId)
- ✅ Access request workflow (request/approve/deny)
- ✅ Admin delegation system (delegate authority to other admins)
- ✅ Leave request simulation (auto-approve/decline with manager comments)
- ✅ Employee status sync service (OnLeave ↔ Active based on leave dates)
- ✅ Compensation-to-contract salary sync
- ✅ Auto-apply migrations on startup
- ✅ Swagger API documentation

### Frontend Features
- ✅ Modern React with TypeScript
- ✅ Cyberpunk/Neon UI theme
- ✅ Dashboard with statistics & charts (auto-refresh every 5s)
- ✅ Department management with jobs
- ✅ Employee management (contracts, attendance, compensation)
- ✅ Recruitment pipeline (candidates, applications)
- ✅ Leave request management (Pending/Approved/Declined tabs)
- ✅ All/Yours scope selector
- ✅ Access request notifications
- ✅ Access timer widget (countdown for granted access)
- ✅ Admin delegation system (delegate responsibilities to other admins)
- ✅ Real-time salary sync between contracts and compensation changes

---

## 📝 License

This project is for educational/internal use.
