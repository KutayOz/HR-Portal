
export type EmploymentStatus = 'Active' | 'Terminated' | 'OnLeave';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';
export type LeaveType = 'Annual' | 'Sick' | 'Maternity' | 'Remote';
export type AttendanceStatus = 'Late' | 'Absent' | 'Present';
export type ApplicationStatus = 'Applied' | 'Interview' | 'Offered' | 'Hired';
export type AnnouncementPriority = 'Critical' | 'High' | 'Normal';

export interface IJob {
  id: number;
  title: string;
  description: string;
  minSalary: number;
  maxSalary: number;
  departmentId: number;
  departmentName?: string;
  isActive?: boolean;
}

export interface IDepartment {
  id: string;
  name: string;
  description: string;
  jobs: IJob[];
  ownerAdminId?: string;
}

export interface IEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  departmentId: string;
  jobTitle: string;
  managerId?: string; // ID of another employee
  status: EmploymentStatus;
  currentSalary: number; // Protected view
  hireDate: string;
  terminationDate?: string;
  avatarUrl: string;
  skills: string[]; // For search capability
  ownerAdminId?: string;
}

export interface ILeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string; // Denormalized for UI convenience
  type: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  ownerAdminId?: string;
}

export interface IAttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkInTime: string; // HH:mm
  checkOutTime?: string; // HH:mm
  totalHours: number;
  status: AttendanceStatus;
}

export interface ICandidate {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  skills: string[];
  linkedInUrl: string;
  resumeUrl: string;
  avatarUrl: string;
  ownerAdminId?: string;
}

export interface IJobApplication {
  id: string;
  candidateId: string;
  candidate: ICandidate; // Nested for easier UI access
  position: string;
  departmentId: string;
  status: ApplicationStatus;
  interviewNotes?: string;
  expectedSalary: number;
  offeredSalary?: number;
  jobId?: number;
  matchScore: number; // 0-100
  ownerAdminId?: string;
}

export interface IAccessRequest {
  id: string;
  resourceType: string;
  resourceId: string;
  ownerAdminId: string;
  requesterAdminId: string;
  status: string;
  requestedAt: string;
  decidedAt?: string;
  allowedUntil?: string;
  note?: string;
}

export interface IAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  expiryDate: string;
}

export type ViewState = 'dashboard' | 'employees' | 'recruitment' | 'leaves' | 'departments' | 'jobs' | 'statistics';
