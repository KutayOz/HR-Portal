using Microsoft.EntityFrameworkCore;
using Common.Entity;

namespace Data.Context
{
    public class HRPortalDbContext : DbContext
    {
        public HRPortalDbContext(DbContextOptions<HRPortalDbContext> options) : base(options)
        {
        }

        //Burada Database bağlantı ayarları yapılır
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                // PostgreSQL 16 connection string
                // Update with your actual connection string
                optionsBuilder.UseNpgsql(
                    "Host=localhost;Port=5432;Database=HRPortalDB;Username=postgres;Password=yourpassword",
                    npgsqlOptions => npgsqlOptions.MigrationsAssembly("Data")
                );
            }
        }

        // Database olarak PostgreSQL 16 kullanılıyor

        //Tüm entity'ler burada DbSet olarak tanımlanır
        public DbSet<Department> Departments { get; set; }
        public DbSet<Job> Jobs { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<LeaveRequest> LeaveRequests { get; set; }
        public DbSet<AttendanceRecord> AttendanceRecords { get; set; }
        public DbSet<EmploymentContract> EmploymentContracts { get; set; }
        public DbSet<Candidate> Candidates { get; set; }
        public DbSet<JobApplication> JobApplications { get; set; }
        public DbSet<Announcement> Announcements { get; set; }
        public DbSet<CompensationChange> CompensationChanges { get; set; }
        public DbSet<AccessRequest> AccessRequests { get; set; }
        public DbSet<AdminDelegation> AdminDelegations { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Department
            modelBuilder.Entity<Department>(entity =>
            {
                entity.HasIndex(e => e.DepartmentName).IsUnique();
            });

            // Configure Employee
            modelBuilder.Entity<Employee>(entity =>
            {
                entity.HasIndex(e => e.Email).IsUnique();
                
                entity.HasOne(e => e.Department)
                    .WithMany(d => d.Employees)
                    .HasForeignKey(e => e.DepartmentId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Job)
                    .WithMany(j => j.Employees)
                    .HasForeignKey(e => e.JobId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Manager)
                    .WithMany(m => m.Subordinates)
                    .HasForeignKey(e => e.ManagerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Job
            modelBuilder.Entity<Job>(entity =>
            {
                entity.HasOne(j => j.Department)
                    .WithMany(d => d.Jobs)
                    .HasForeignKey(j => j.DepartmentId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure LeaveRequest
            modelBuilder.Entity<LeaveRequest>(entity =>
            {
                entity.HasOne(lr => lr.Employee)
                    .WithMany(e => e.LeaveRequests)
                    .HasForeignKey(lr => lr.EmployeeId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure AttendanceRecord
            modelBuilder.Entity<AttendanceRecord>(entity =>
            {
                entity.HasOne(ar => ar.Employee)
                    .WithMany(e => e.AttendanceRecords)
                    .HasForeignKey(ar => ar.EmployeeId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => new { e.EmployeeId, e.Date }).IsUnique();
            });

            // Configure EmploymentContract
            modelBuilder.Entity<EmploymentContract>(entity =>
            {
                entity.HasOne(ec => ec.Employee)
                    .WithMany(e => e.EmploymentContracts)
                    .HasForeignKey(ec => ec.EmployeeId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Candidate
            modelBuilder.Entity<Candidate>(entity =>
            {
                entity.HasIndex(e => e.Email).IsUnique();
            });

            // Configure JobApplication
            modelBuilder.Entity<JobApplication>(entity =>
            {
                entity.HasOne(ja => ja.Candidate)
                    .WithMany(c => c.JobApplications)
                    .HasForeignKey(ja => ja.CandidateId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ja => ja.Job)
                    .WithMany(j => j.JobApplications)
                    .HasForeignKey(ja => ja.JobId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Announcement
            modelBuilder.Entity<Announcement>(entity =>
            {
                entity.HasOne(a => a.TargetDepartment)
                    .WithMany()
                    .HasForeignKey(a => a.TargetDepartmentId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure CompensationChange
            modelBuilder.Entity<CompensationChange>(entity =>
            {
                entity.HasOne(cc => cc.Employee)
                    .WithMany(e => e.CompensationChanges)
                    .HasForeignKey(cc => cc.EmployeeId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<AccessRequest>(entity =>
            {
                entity.HasIndex(e => new { e.OwnerAdminId, e.Status });
                entity.HasIndex(e => new { e.RequesterAdminId, e.Status });
                entity.HasIndex(e => new { e.ResourceType, e.ResourceId });
            });

            modelBuilder.Entity<AdminDelegation>(entity =>
            {
                entity.HasIndex(e => new { e.FromAdminId, e.Status });
                entity.HasIndex(e => new { e.ToAdminId, e.Status });
                entity.HasIndex(e => new { e.ToAdminId, e.EndDate });
            });
        }
    }
}