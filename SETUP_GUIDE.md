# Frontend-Backend Integration Setup Guide

This guide will help you set up and run the connected HR Portal application.

## Prerequisites

- PostgreSQL 16 installed and running
- .NET 10 SDK installed
- Node.js (v18 or higher) and npm installed

## Backend Setup

### 1. Configure Database Connection

Update the connection string in `/backend/API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=HRPortalDB;Username=postgres;Password=yourpassword"
  }
}
```

### 2. Run Database Migrations

From the project root directory:

```bash
cd backend
dotnet ef database update --project Data/Data.csproj --startup-project API/API.csproj
```

### 3. Start the Backend API

```bash
cd API
dotnet run
```

The API will start on `https://localhost:5001` with Swagger UI available at `https://localhost:5001/swagger`

## Frontend Setup

### 1. Install Dependencies

From the frontend directory:

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5001/api
```

> **Note:** Use `http://localhost:5001/api` (not https) unless you have SSL configured

### 3. Start the Frontend Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is in use)

## Available API Endpoints

The backend provides the following RESTful endpoints:

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/{id}` - Get employee by ID

### Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/{id}` - Get department by ID

### Job Applications
- `GET /api/jobapplications` - Get all job applications
- `GET /api/jobapplications/{id}` - Get job application by ID

### Leave Requests
- `GET /api/leaverequests` - Get all leave requests
- `GET /api/leaverequests/{id}` - Get leave request by ID

### Announcements
- `GET /api/announcements` - Get all active announcements
- `GET /api/announcements/{id}` - Get announcement by ID

## Testing the Integration

1. **Start the backend first** (on port 5001)
2. **Start the frontend** (on port 5173)
3. **Navigate to** `http://localhost:5173`
4. **Login** with any credentials (authentication is not yet implemented)
5. **Navigate through** the different sections:
   - Dashboard - Shows overview with statistics
   - Personnel - Lists all employees
   - Recruitment - Shows job applications
   - Flux Timeline - Displays leave requests

## Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
- Ensure the backend is running on port 5001
- Verify the frontend URL is included in the CORS policy in `Program.cs`
- Check that you're using `http://localhost:5173` (not 127.0.0.1)

### Database Connection Errors
- Verify PostgreSQL is running
- Check the connection string in `appsettings.json`
- Ensure the database exists (migrations should create it)
- Verify the PostgreSQL user has proper permissions

### Empty Data in Frontend
- Check the browser console for API errors
- Verify the backend API is returning data (use Swagger UI or Postman)
- Ensure the database has been seeded with data (you may need to add seed data)

## Adding Sample Data

To test the application, you'll need to add sample data to your database. You can:

1. Use the Swagger UI at `https://localhost:5001/swagger` to add data via the API (when POST endpoints are implemented)
2. Run SQL INSERT statements directly in PostgreSQL
3. Create a database seeder in the backend (recommended for development)

## Next Steps

- Implement POST/PUT/DELETE endpoints for CRUD operations
- Add authentication and authorization
- Implement data validation
- Add error handling and logging
- Create database seeding for development
- Add unit and integration tests

## Architecture Notes

The application follows a clean architecture:

### Backend
- **API Layer**: Controllers that handle HTTP requests
- **Data Layer**: Entity Framework DbContext and migrations
- **Common Layer**: Entity models (not modified per requirements)
- **DTOs**: Data transfer objects for API responses

### Frontend
- **Components**: Reusable UI components
- **Features**: Feature-based modules (Dashboard, Employees, etc.)
- **Services**: API integration layer
- **Types**: TypeScript type definitions

The integration preserves the existing layered architecture without modifying entities.
