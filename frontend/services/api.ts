
import {
  IEmployee,
  IDepartment,
  IJobApplication,
  ILeaveRequest,
  IAttendanceRecord,
  IAnnouncement
} from '../types';
import { API_BASE_URL } from '../constants';

// Helper function for API calls
const fetchApi = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: options?.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      const baseMessage = errorData.message || `API error: ${response.status} ${response.statusText}`;
      const details = errorData.error ? `: ${errorData.error}` : '';

      throw new Error(`${baseMessage}${details}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error with ${endpoint}:`, error);
    throw error;
  }
};

// --- API Functions ---
export const getEmployees = async (): Promise<IEmployee[]> => {
  try {
    return await fetchApi<IEmployee[]>('/employees');
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    // Return empty array as fallback
    return [];
  }
};

export const getDepartments = async (): Promise<IDepartment[]> => {
  try {
    return await fetchApi<IDepartment[]>('/departments');
  } catch (error) {
    console.error('Failed to fetch departments:', error);
    return [];
  }
};

export const getApplications = async (): Promise<IJobApplication[]> => {
  try {
    return await fetchApi<IJobApplication[]>('/jobapplications');
  } catch (error) {
    console.error('Failed to fetch job applications:', error);
    return [];
  }
};

export const getLeaves = async (): Promise<ILeaveRequest[]> => {
  try {
    return await fetchApi<ILeaveRequest[]>('/leaverequests');
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
export const getCandidates = async (): Promise<any[]> => {
  return await fetchApi<any[]>('/candidates');
};

export const createCandidate = async (data: any): Promise<any> => {
  return await fetchApi<any>('/candidates', {
    method: 'POST',
    body: JSON.stringify(data),
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
  return await fetchApi<any>(`/jobapplications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteJobApplication = async (id: string): Promise<void> => {
  await fetchApi(`/jobapplications/${id}`, {
    method: 'DELETE',
  });
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
