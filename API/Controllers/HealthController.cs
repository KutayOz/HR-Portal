using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data.Context;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly HRPortalDbContext _context;

        public HealthController(HRPortalDbContext context)
        {
            _context = context;
        }

        [HttpGet("db-check")]
        public async Task<IActionResult> CheckDatabase()
        {
            try
            {
                var canConnect = await _context.Database.CanConnectAsync();

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
