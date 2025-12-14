
import {
  IEmployee,
  IDepartment,
  IJobApplication,
  ILeaveRequest,
  IAttendanceRecord,
  IAnnouncement,
  IAccessRequest,
  ICandidate
} from '../types';
import { API_BASE_URL } from '../constants';

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const getAdminId = (): string | null => {
  try {
    return localStorage.getItem('adminId');
  } catch {
    return null;
  }
};

const withScope = (endpoint: string, scope?: 'all' | 'yours'): string => {
  if (!scope) return endpoint;
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${separator}scope=${encodeURIComponent(scope)}`;
};

// Helper function for API calls with timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 10000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

const fetchApi = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  try {
    const adminId = getAdminId();
    const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
      method: options?.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(adminId ? { 'X-Admin-Id': adminId } : {}),
        ...options?.headers,
      },
      credentials: 'include',
      cache: 'no-store',
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      const baseMessage = errorData.message || `API error: ${response.status} ${response.statusText}`;
      throw new ApiError(baseMessage, response.status, errorData);
    }

    // Handle empty responses (e.g., 204 No Content or DELETE operations)
    const contentType = response.headers.get('content-type');
    if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text);
  } catch (error) {
    console.error(`Error with ${endpoint}:`, error);
    throw error;
  }
};

// --- API Functions ---
export const getEmployees = async (scope?: 'all' | 'yours'): Promise<IEmployee[]> => {
  const result = await fetchApi<IEmployee[]>(withScope('/employees', scope));
  if (!Array.isArray(result)) {
    throw new Error('Invalid employees response');
  }
  return result;
};

export const getDepartments = async (scope?: 'all' | 'yours'): Promise<IDepartment[]> => {
  try {
    return await fetchApi<IDepartment[]>(withScope('/departments', scope));
  } catch (error) {
    console.error('Failed to fetch departments:', error);
    return [];
  }
};

export const getApplications = async (scope?: 'all' | 'yours'): Promise<IJobApplication[]> => {
  try {
    return await fetchApi<IJobApplication[]>(withScope('/jobapplications', scope));
  } catch (error) {
    console.error('Failed to fetch job applications:', error);
    return [];
  }
};

export const getLeaves = async (scope?: 'all' | 'yours'): Promise<ILeaveRequest[]> => {
  try {
    return await fetchApi<ILeaveRequest[]>(withScope('/leaverequests', scope));
  } catch (error) {
    console.error('Failed to fetch leave requests:', error);
    return [];
  }
};

export const getAnnouncements = async (): Promise<IAnnouncement[]> => {
  try {
    return await fetchApi<IAnnouncement[]>('/announcements');
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    return [];
  }
};

// --- CREATE Functions ---
export const createEmployee = async (data: any): Promise<IEmployee> => {
  return await fetchApi<IEmployee>('/employees', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const createLeaveRequest = async (data: any): Promise<ILeaveRequest> => {
  return await fetchApi<ILeaveRequest>('/leaverequests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const createAnnouncement = async (data: any): Promise<IAnnouncement> => {
  return await fetchApi<IAnnouncement>('/announcements', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// --- UPDATE Functions ---
export const updateEmployee = async (id: string, data: any): Promise<IEmployee> => {
  return await fetchApi<IEmployee>(`/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const updateLeaveStatus = async (id: string, status: string, comments?: string): Promise<ILeaveRequest> => {
  return await fetchApi<ILeaveRequest>(`/leaverequests/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, approverComments: comments }),
  });
};

// --- DELETE Functions ---
export const deleteEmployee = async (id: string): Promise<void> => {
  await fetchApi(`/employees/${id}`, {
    method: 'DELETE',
  });
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  await fetchApi(`/announcements/${id}`, {
    method: 'DELETE',
  });
};

// --- DEPARTMENT CRUD Functions ---
export const createDepartment = async (data: any): Promise<IDepartment> => {
  return await fetchApi<IDepartment>('/departments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateDepartment = async (id: string, data: any): Promise<IDepartment> => {
  return await fetchApi<IDepartment>(`/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteDepartment = async (id: string): Promise<void> => {
  await fetchApi(`/departments/${id}`, {
    method: 'DELETE',
  });
};

// --- JOB Functions ---
export const getJobs = async (): Promise<any[]> => {
  return await fetchApi<any[]>('/jobs');
};

export const getJobsByDepartment = async (departmentId: number): Promise<any[]> => {
  return await fetchApi<any[]>(`/jobs/department/${departmentId}`);
};

export const createJob = async (data: any): Promise<any> => {
  return await fetchApi<any>('/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateJob = async (id: number, data: any): Promise<any> => {
  return await fetchApi<any>(`/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteJob = async (id: number): Promise<void> => {
  await fetchApi(`/jobs/${id}`, {
    method: 'DELETE',
  });
};

// --- CANDIDATE Functions ---
export const getCandidates = async (): Promise<ICandidate[]> => {
  return await fetchApi<ICandidate[]>('/candidates');
};

export const getCandidatesScoped = async (scope?: 'all' | 'yours'): Promise<ICandidate[]> => {
  return await fetchApi<ICandidate[]>(withScope('/candidates', scope));
};

export const createCandidate = async (data: any): Promise<any> => {
  return await fetchApi<any>('/candidates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const deleteCandidate = async (id: number): Promise<void> => {
  console.log('Deleting candidate with id:', id);
  await fetchApi(`/candidates/${id}`, {
    method: 'DELETE',
  });
};

// --- JOB APPLICATION (Recruitment) Functions ---
export const createJobApplication = async (data: any): Promise<any> => {
  return await fetchApi<any>('/jobapplications', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateJobApplication = async (id: string, data: any): Promise<any> => {
  // Backend uses camelCase JSON policy, so send camelCase keys
  const payload: any = {
    status: data.status ?? data.Status,
    interviewNotes: data.interviewNotes ?? data.InterviewNotes ?? null,
  };
  
  // Include offeredSalary if provided (from Offer stage)
  if (data.offeredSalary !== undefined) {
    payload.offeredSalary = data.offeredSalary;
  }

  console.log('updateJobApplication called with:', { id, payload });

  const result = await fetchApi<any>(`/jobapplications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  console.log('updateJobApplication result:', result);
  return result;
};

export const deleteJobApplication = async (id: string): Promise<void> => {
  console.log('Deleting job application with id:', id);
  const result = await fetchApi(`/jobapplications/${id}`, {
    method: 'DELETE',
  });
  console.log('Delete result:', result);
};

// --- EMPLOYMENT CONTRACT Functions ---
export const getContractsByEmployee = async (employeeId: number): Promise<any[]> => {
  return await fetchApi<any[]>(`/employmentcontracts/employee/${employeeId}`);
};

export const createContract = async (data: any): Promise<any> => {
  return await fetchApi<any>('/employmentcontracts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateContract = async (id: number, data: any): Promise<any> => {
  return await fetchApi<any>(`/employmentcontracts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteContract = async (id: number): Promise<void> => {
  await fetchApi(`/employmentcontracts/${id}`, {
    method: 'DELETE',
  });
};

// --- COMPENSATION CHANGE Functions ---
export const getCompensationChangesByEmployee = async (employeeId: number): Promise<any[]> => {
  return await fetchApi<any[]>(`/compensationchanges/employee/${employeeId}`);
};

export const createCompensationChange = async (data: any): Promise<any> => {
  return await fetchApi<any>('/compensationchanges', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateCompensationChange = async (id: number, data: any): Promise<any> => {
  return await fetchApi<any>(`/compensationchanges/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteCompensationChange = async (id: number): Promise<void> => {
  await fetchApi(`/compensationchanges/${id}`, {
    method: 'DELETE',
  });
};

// --- ATTENDANCE RECORD Functions ---
export const getAttendanceRecordsByEmployee = async (employeeId: number): Promise<any[]> => {
  return await fetchApi<any[]>(`/attendancerecords/employee/${employeeId}`);
};

export const createAttendanceRecord = async (data: any): Promise<any> => {
  return await fetchApi<any>('/attendancerecords', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateAttendanceRecord = async (id: number, data: any): Promise<any> => {
  return await fetchApi<any>(`/attendancerecords/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteAttendanceRecord = async (id: number): Promise<void> => {
  await fetchApi(`/attendancerecords/${id}`, {
    method: 'DELETE',
  });
};

// --- ACCESS REQUESTS ---
export const getAccessInbox = async (): Promise<IAccessRequest[]> => {
  return await fetchApi<IAccessRequest[]>('/accessrequests/inbox');
};

export const getAccessOutbox = async (): Promise<IAccessRequest[]> => {
  return await fetchApi<IAccessRequest[]>('/accessrequests/outbox');
};

export const createAccessRequest = async (resourceType: string, resourceId: string, note?: string): Promise<IAccessRequest> => {
  return await fetchApi<IAccessRequest>('/accessrequests', {
    method: 'POST',
    body: JSON.stringify({ resourceType, resourceId, note }),
  });
};

export const approveAccessRequest = async (id: string, allowMinutes = 15): Promise<IAccessRequest> => {
  return await fetchApi<IAccessRequest>(`/accessrequests/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ allowMinutes }),
  });
};

export const denyAccessRequest = async (id: string): Promise<IAccessRequest> => {
  return await fetchApi<IAccessRequest>(`/accessrequests/${id}/deny`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
};
