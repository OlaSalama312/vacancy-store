using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AccessoriesStore.Api.Migrations
{
    public partial class AddPaymentProof : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "PaymentProof",
                table: "Orders",
                type: "bytea",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentProofContentType",
                table: "Orders",
                type: "text",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentProof",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaymentProofContentType",
                table: "Orders");
        }
    }
}


