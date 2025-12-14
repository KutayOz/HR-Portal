using Application.DTOs;
using Application.Infrastructure;

namespace Application.Services;

public interface ICandidateService
{
    Task<List<CandidateDto>> GetCandidatesAsync(OwnershipScope scope);
    Task<(CandidateDto? Result, string? ErrorMessage)> CreateCandidateAsync(CreateCandidateDto dto);
    Task<(bool Success, string? ErrorMessage, bool NotFound)> DeleteCandidateAsync(int id);
}
