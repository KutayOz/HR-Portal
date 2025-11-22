namespace API.DTOs
{
    public class CreateDepartmentDto
    {
        public string DepartmentName { get; set; }
        public string? Description { get; set; }
        public List<CreateDepartmentJobDto>? Jobs { get; set; }
    }

    public class CreateDepartmentJobDto
    {
        public string JobTitle { get; set; }
        public decimal? MinSalary { get; set; }
        public decimal? MaxSalary { get; set; }
    }

    public class UpdateDepartmentJobDto
    {
        public int Id { get; set; }
        public string JobTitle { get; set; }
        public decimal? MinSalary { get; set; }
        public decimal? MaxSalary { get; set; }
    }

    public class UpdateDepartmentDto
    {
        public string DepartmentName { get; set; }
        public string? Description { get; set; }
        public List<UpdateDepartmentJobDto>? Jobs { get; set; }
    }
}
