using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Application.Services;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly IHealthService _healthService;

        public HealthController(IHealthService healthService)
        {
            _healthService = healthService;
        }

        [HttpGet("db-check")]
        public async Task<IActionResult> CheckDatabase()
        {
            try
            {
                var (canConnect, errorMessage) = await _healthService.CheckDatabaseAsync();

                if (canConnect)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Veritabanı bağlantısı başarılı."
                    });
                }

                return StatusCode(500, new
                {
                    success = false,
                    message = "Veritabanına bağlanılamadı."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Veritabanı bağlantı denemesinde hata oluştu.",
                    error = ex.Message
                });
            }
        }
    }
}
