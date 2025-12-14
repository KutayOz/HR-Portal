# Dependency Injection (DI) and SOLID in this project

This document explains where **Dependency Injection** and the **SOLID principles** appear in the codebase, with concrete file references.

## 1) Where Dependency Injection (DI) is in the project

### 1.1 The DI “composition root” (where dependencies are registered)

- **File**: `backend/API/Program.cs`

This is the main entry point of the ASP.NET Core API. In ASP.NET Core, DI is configured through the built-in service container at startup.

In this project, the most important DI registrations are:

- `builder.Services.AddDbContext<HRPortalDbContext>(...)`
- `builder.Services.AddDataAccess()`
- `builder.Services.AddApplication()`

`AddDbContext` registers `HRPortalDbContext` so it can be injected into the **DataAccess** layer (repositories). The `AddDataAccess()` and `AddApplication()` extension methods register the repository implementations and business services used by controllers.

### 1.2 Where dependencies are injected (constructor injection)

Controllers use **constructor injection**. They declare required dependencies as constructor parameters, and ASP.NET Core supplies them at runtime.

Representative examples:

- **File**: `backend/API/Controllers/DepartmentsController.cs`
  - Constructor takes:
    - `IDepartmentService departmentService`
    - `ILogger<DepartmentsController> logger`

- **File**: `backend/API/Controllers/EmployeesController.cs`
  - Constructor takes:
    - `IEmployeeService employeeService`
    - `ILogger<EmployeesController> logger`

- **File**: `backend/API/Controllers/HealthController.cs`
  - Constructor takes:
    - `IHealthService healthService`

A global view of the pattern across controllers can be seen by checking:

- `backend/API/Controllers/*Controller.cs`

### 1.3 DI-related note: EF Core design-time DbContext factory (not runtime DI)

- **File**: `backend/Data/Context/HRPortalDbContextFactory.cs`

This factory is used by **Entity Framework Core tooling** (migrations) at design time. It manually constructs `HRPortalDbContext` by calling `new HRPortalDbContext(...)`.

This is *not* how your web application creates the DbContext at runtime; at runtime you rely on DI (`AddDbContext` in `Program.cs`).

### 1.4 Frontend “DI” (not a DI container, but dependency management)

The frontend does not use a formal DI container like the backend. Instead it uses:

- module imports (ES Modules)
- TypeScript interfaces/types as contracts

Key example:

- **File**: `frontend/services/api.ts`
  - Contains `fetchApi<T>()` and exported functions like `getEmployees()`, `getDepartments()`, etc.
  - Components/features import these functions directly.

There is no `React Context`-based DI/provider pattern detected (no usage of `createContext` / `useContext` in the current scan).

## 2) SOLID principles in this project (with examples)

Important context: your backend is now organized as a **3-layer (clean) architecture (Option B)**:

- **API**: HTTP endpoints (thin controllers)
- **Application**: business logic (services) + repository interfaces (ports) + DTOs
- **DataAccess**: repository implementations (EF Core) that depend on `HRPortalDbContext`

### S — Single Responsibility Principle (SRP)

**What SRP means:** one class/module should have one main reason to change.

#### Where SRP is applied well

- **Entity classes are focused on data modeling**
  - **Files**:
    - `backend/Common/Entity/Department.cs`
    - `backend/Common/Entity/Employee.cs`
  - These primarily represent the database/business data structure.

- **DTOs are separated from entities (API contracts separated from persistence models)**
  - **Files**:
    - `backend/Application/DTOs/DepartmentDto.cs`
    - `backend/Application/DTOs/CreateDepartmentDto.cs`
  - This helps keep the API response/request shape separate from the EF Core entities.

- **Controllers delegate business/data work to Application services**
  - **Files**:
    - `backend/API/Controllers/DepartmentsController.cs`
    - `backend/API/Controllers/JobsController.cs`
  - Controllers focus on HTTP concerns (routing, status codes) and call services for business operations.

#### Where SRP can still be improved

- Some controllers still contain repetitive error-handling / response shaping logic (try/catch patterns). This is normal, but if you want stricter SRP you can centralize cross-cutting concerns via middleware/filters.

### O — Open/Closed Principle (OCP)

**What OCP means:** software entities should be open for extension but closed for modification.

#### Current state in this project

OCP is strengthened by the Application/DataAccess split:

- Controllers can remain unchanged while you extend/modify business rules inside **Application services**.
- You can add alternative implementations of repository interfaces (for caching, mocks, or different data sources) without changing service/controller code.

Key “extension points”:

- **Service interfaces**: `backend/Application/Services/I*Service.cs`
- **Repository interfaces (ports)**: `backend/Application/Repositories/I*Repository.cs`

### L — Liskov Substitution Principle (LSP)

**What LSP means:** subclasses should be substitutable for their base classes without breaking correctness.

#### Current state in this project

LSP becomes relevant now that the API depends on interfaces (services/ports). For example, any implementation of `IDepartmentService` should be safely substitutable without changing controller behavior.

### I — Interface Segregation Principle (ISP)

**What ISP means:** prefer many small, specific interfaces over one big “fat” interface.

#### Current state in this project

ISP is applied via multiple small, focused interfaces:

- **Service interfaces**: `backend/Application/Services/IEmployeeService.cs`, `backend/Application/Services/IJobService.cs`, etc.
- **Repository interfaces**: `backend/Application/Repositories/IEmployeeRepository.cs`, `backend/Application/Repositories/IJobRepository.cs`, etc.

Each feature depends only on the contract it needs, rather than a single “god interface”.

### D — Dependency Inversion Principle (DIP)

**What DIP means:** depend on abstractions, not concretions.

#### Where DIP is applied

- Controllers depend on `ILogger<T>` (an abstraction provided by ASP.NET Core).
  - Example:
    - `backend/API/Controllers/DepartmentsController.cs` depends on `ILogger<DepartmentsController>`

- Controllers depend on **service interfaces** (Application layer abstractions).
  - Examples:
    - `backend/API/Controllers/DepartmentsController.cs` depends on `IDepartmentService`
    - `backend/API/Controllers/JobsController.cs` depends on `IJobService`

This is a DIP-friendly dependency: the controller does not create a logger; it receives one.

#### Where DIP is weak

If you want to be stricter about DIP, you can keep EF Core and other infrastructure concerns entirely inside the DataAccess layer. In the current design, this is already mostly true:

- controller depends on `I*Service`
- service depends on `I*Repository`
- repository depends on `HRPortalDbContext`

## 3) Quick map: how requests flow (backend)

- HTTP request hits an endpoint in:
  - `backend/API/Controllers/*Controller.cs`
- Controller calls an Application service (e.g., `IEmployeeService`).
- Application service uses a repository interface (port) defined in:
  - `backend/Application/Repositories/*`
- DataAccess implements those ports and uses EF Core via:
  - `backend/Data/Context/HRPortalDbContext.cs`
- Entities involved are in:
  - `backend/Common/Entity/*`

## 4) Summary of “what you have” vs “what would be more SOLID”

### What you already have

- DI container usage in ASP.NET Core:
  - `backend/API/Program.cs`
- DI registration split by layer:
  - `backend/Application/DependencyInjection.cs` (`AddApplication`)
  - `backend/DataAccess/DependencyInjection.cs` (`AddDataAccess`)
- Constructor injection in controllers (thin controllers):
  - `backend/API/Controllers/*Controller.cs`
- SRP separation between:
  - Entities (`backend/Common/Entity/*`)
  - DTOs (`backend/Application/DTOs/*`)
  - Services (`backend/Application/Services/*`)
  - Repositories (`backend/DataAccess/Repository/*`)

### What is currently missing (typical SOLID/DI improvements)

At this stage, the core SOLID/DI pieces are already in place. Common next improvements are:

- Centralize error handling / response shaping via middleware or filters.
- Add automated tests (unit tests for Application services, integration tests for DataAccess).
- Consider removing duplicate/legacy DTOs that still live under `backend/API/DTOs` if they are no longer used.

These changes would:

- strengthen SRP (controllers become thin)
- strengthen DIP (controllers depend on interfaces)
- enable OCP/LSP/ISP to matter more (multiple implementations, smaller contracts)

