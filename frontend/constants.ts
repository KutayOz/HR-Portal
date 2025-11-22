
import { Scan, Users, Briefcase, CalendarClock, Building2 } from 'lucide-react';

// API Configuration
// Default backend URL aligned with ASP.NET Core default (http://localhost:5000)
// Can be overridden via VITE_API_URL in .env for custom ports/environments
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Command Center', icon: Scan },
  { id: 'employees', label: 'Personnel', icon: Users },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'recruitment', label: 'Recruitment', icon: Briefcase },
  { id: 'leaves', label: 'Flux Timeline', icon: CalendarClock },
];
