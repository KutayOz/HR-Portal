using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminDelegation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AdminDelegations",
                columns: table => new
                {
                    DelegationId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FromAdminId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ToAdminId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminDelegations", x => x.DelegationId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdminDelegations_FromAdminId_Status",
                table: "AdminDelegations",
                columns: new[] { "FromAdminId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_AdminDelegations_ToAdminId_EndDate",
                table: "AdminDelegations",
                columns: new[] { "ToAdminId", "EndDate" });

            migrationBuilder.CreateIndex(
                name: "IX_AdminDelegations_ToAdminId_Status",
                table: "AdminDelegations",
                columns: new[] { "ToAdminId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdminDelegations");
        }
    }
}
