using System.ComponentModel.DataAnnotations;

namespace API.DTOs
{
    public class AttendanceRecordDto
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; }
        public DateTime Date { get; set; }
        public string CheckInTime { get; set; }
        public string CheckOutTime { get; set; }
        public double TotalHours { get; set; }
        public string Status { get; set; }
        public string Remarks { get; set; }
    }

    public class CreateAttendanceRecordDto
    {
        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required]
        public string CheckInTime { get; set; } // HH:mm

        public string CheckOutTime { get; set; } // HH:mm

        [Required]
        public string Status { get; set; }

        public string Remarks { get; set; }
    }

    public class UpdateAttendanceRecordDto
    {
        [Required]
        public DateTime Date { get; set; }

        [Required]
        public string CheckInTime { get; set; }

        public string CheckOutTime { get; set; }

        [Required]
        public string Status { get; set; }

        public string Remarks { get; set; }
    }
}
