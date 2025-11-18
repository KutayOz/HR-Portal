# Database Migration Guide

## Prerequisites

1. **PostgreSQL 16** installed and running
2. **.NET 10 SDK** installed
3. **dotnet-ef tool** installed globally

## Step 1: Install PostgreSQL 16

### macOS (using Homebrew):
```bash
brew install postgresql@16
brew services start postgresql@16
```

### Create Database:
```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE HRPortalDB;

# Create user (if needed)
CREATE USER postgres WITH PASSWORD 'yourpassword';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE HRPortalDB TO postgres;

# Exit
\q
```

## Step 2: Update Connection Strings

### Update in API/appsettings.json:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=HRPortalDB;Username=postgres;Password=yourpassword"
  }
}
```

### Update in Data/Context/HRPortalDbContextFactory.cs:
```csharp
optionsBuilder.UseNpgsql(
    "Host=localhost;Port=5432;Database=HRPortalDB;Username=postgres;Password=yourpassword",
    npgsqlOptions => npgsqlOptions.MigrationsAssembly("Data")
);
```

## Step 3: Verify EF Core Tools

```bash
# Install dotnet-ef globally if not already installed
dotnet tool install --global dotnet-ef

# Or update to latest version
dotnet tool update --global dotnet-ef

# Verify installation
dotnet ef --version
```

## Step 4: Apply Migrations

From the project root directory:

```bash
# Apply the migration to create all tables
dotnet ef database update --project Data/Data.csproj --startup-project API/API.csproj
```

Expected output:
```
Build started...
Build succeeded.
Applying migration '20251118074049_InitialCreate'.
Done.
```

## Step 5: Verify Database

### Using psql:
```bash
# Connect to the database
psql -U postgres -d HRPortalDB

# List all tables
\dt

# Expected tables:
# - Announcements
# - AttendanceRecords
# - Candidates
# - CompensationChanges
# - Departments
# - EmploymentContracts
# - Employees
# - JobApplications
# - Jobs
# - LeaveRequests
# - __EFMigrationsHistory

# View table structure
\d Employees

# Exit
\q
```

### Using pgAdmin or any PostgreSQL client:
1. Connect to localhost:5432
2. Navigate to HRPortalDB
3. Check Tables under public schema
4. Verify all 10 tables + migrations history table exist

## Common Issues and Solutions

### Issue 1: Connection Failed
**Error:** `could not connect to server`

**Solution:**
```bash
# Check if PostgreSQL is running
brew services list

# Start PostgreSQL
brew services start postgresql@16

# Check port
lsof -i :5432
```

### Issue 2: Authentication Failed
**Error:** `password authentication failed for user "postgres"`

**Solution:**
- Verify username and password in connection strings
- Reset PostgreSQL password if needed:
```bash
psql postgres
ALTER USER postgres WITH PASSWORD 'newpassword';
```

### Issue 3: Database Does Not Exist
**Error:** `database "HRPortalDB" does not exist`

**Solution:**
```bash
# Create the database
psql postgres -c "CREATE DATABASE HRPortalDB;"
```

### Issue 4: Migration Already Applied
**Error:** `The migration '20251118074049_InitialCreate' has already been applied to the database`

**Solution:**
This is normal - the migration is already applied. No action needed.

To revert and reapply:
```bash
# Revert migration
dotnet ef database update 0 --project Data/Data.csproj --startup-project API/API.csproj

# Reapply migration
dotnet ef database update --project Data/Data.csproj --startup-project API/API.csproj
```

## Useful Commands

### Check Migration Status
```bash
dotnet ef migrations list --project Data/Data.csproj --startup-project API/API.csproj
```

### Generate SQL Script
```bash
dotnet ef migrations script --project Data/Data.csproj --startup-project API/API.csproj -o migration.sql
```

### Remove Last Migration (if not applied)
```bash
dotnet ef migrations remove --project Data/Data.csproj --startup-project API/API.csproj
```

### Drop Database and Recreate
```bash
# Drop database
dotnet ef database drop --project Data/Data.csproj --startup-project API/API.csproj

# Recreate and apply migrations
dotnet ef database update --project Data/Data.csproj --startup-project API/API.csproj
```

## Database Seeding (Optional)

After applying migrations, you may want to seed initial data. Create a new migration:

```bash
dotnet ef migrations add SeedInitialData --project Data/Data.csproj --startup-project API/API.csproj
```

Then add seed data in the `Up` method of the generated migration file.

## Next Migration

When you need to add/modify entities:

1. **Update entity classes** in Common/Entity/
2. **Update DbContext** if needed
3. **Create new migration**:
```bash
dotnet ef migrations add YourMigrationName --project Data/Data.csproj --startup-project API/API.csproj
```
4. **Review migration** in Data/Migrations/
5. **Apply migration**:
```bash
dotnet ef database update --project Data/Data.csproj --startup-project API/API.csproj
```

## Production Deployment

For production:

1. **Never use default passwords**
2. **Use environment variables** for connection strings
3. **Apply migrations** via CI/CD pipeline
4. **Always backup** database before migrations
5. **Test migrations** in staging environment first

Example production connection string:
```bash
Host=production-server;Port=5432;Database=HRPortalDB;Username=hr_app_user;Password=strong_password_here;SSL Mode=Require;
```

## Backup and Restore

### Backup:
```bash
pg_dump -U postgres -d HRPortalDB -F c -f hrportal_backup.dump
```

### Restore:
```bash
pg_restore -U postgres -d HRPortalDB -F c hrportal_backup.dump
```

## Support

For issues with:
- **PostgreSQL**: Check [PostgreSQL Documentation](https://www.postgresql.org/docs/16/)
- **Entity Framework Core**: Check [EF Core Documentation](https://learn.microsoft.com/en-us/ef/core/)
- **Npgsql**: Check [Npgsql Documentation](https://www.npgsql.org/doc/)
