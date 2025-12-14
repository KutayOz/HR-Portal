using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOwnershipAndAccessRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OwnerAdminId",
                table: "LeaveRequests",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OwnerAdminId",
                table: "JobApplications",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OwnerAdminId",
                table: "Employees",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OwnerAdminId",
                table: "Departments",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OwnerAdminId",
                table: "Candidates",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AccessRequests",
                columns: table => new
                {
                    AccessRequestId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ResourceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ResourceId = table.Column<int>(type: "integer", nullable: false),
                    OwnerAdminId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RequesterAdminId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DecidedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AllowedUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccessRequests", x => x.AccessRequestId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AccessRequests_OwnerAdminId_Status",
                table: "AccessRequests",
                columns: new[] { "OwnerAdminId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_AccessRequests_RequesterAdminId_Status",
                table: "AccessRequests",
                columns: new[] { "RequesterAdminId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_AccessRequests_ResourceType_ResourceId",
                table: "AccessRequests",
                columns: new[] { "ResourceType", "ResourceId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccessRequests");

            migrationBuilder.DropColumn(
                name: "OwnerAdminId",
                table: "LeaveRequests");

            migrationBuilder.DropColumn(
                name: "OwnerAdminId",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "OwnerAdminId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "OwnerAdminId",
                table: "Departments");

            migrationBuilder.DropColumn(
                name: "OwnerAdminId",
                table: "Candidates");
        }
    }
}
