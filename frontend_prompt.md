# Frontend Generation Prompt

**Role:** You are a Senior React & Frontend Developer who specializes in modern UI/UX principles, animations, and visual aesthetics.

**Task:** I want you to write the frontend code for the "Neon Horizon HR Command Center" application from scratch, based on the technical details and design language provided below. The application will be a futuristic, cyberpunk-themed HR management panel.

---

### 🛠 Tech Stack
- **Framework:** React 19 (with Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (with Custom config)
- **Icons:** Lucide React
- **Animation:** Framer Motion (`AnimatePresence` and `motion` components should be used heavily)
- **Charts:** Recharts

### 🎨 Design Language and Theme (Design System)
**General Atmosphere:**
- Dark mode based (#050505), with neon accents, containing "glassmorphism" and "holographic" effects.
- Persistent "ambient glow" effects in the background (purple and cyan colors).

**Color Palette (Tailwind Config):**
- `bg-dark`: #050505 (Main background)
- `neon-cyan`: #00f3ff (Main accent)
- `neon-purple`: #bd00ff (Secondary accent)
- `neon-green`: #0aff64 (Success/Online status)
- `neon-red`: #ff003c (Warning/Error)
- `neon-glass`: rgba(10, 10, 15, 0.6)

**Typography:**
- Headings & Logo: **Orbitron** (Futuristic)
- UI Labels / Data: **Rajdhani** (Technical look)
- Body Text: **Inter** (For readability)

**Special Effects (CSS):**
- **Neon Text Glow:** Slight outer glow on text.
- **Custom Scrollbar:** Thin, with a black track and neon thumb.
- **Glassmorphism:** `backdrop-blur` effect on Header and cards.

---

### 📂 Application Structure and Features

**1. Layout (App.tsx):**
- **Header:** `fixed` position, with glass effect. "HR Portal" logo on the left, live digital clock (including seconds), notification bell, and Admin profile dropdown on the right.
- **Navigation:** Simple state-based routing (switching between Dashboard, Employees, Recruitment, Leaves, Departments, Jobs pages using `currentView` state).
- **Background:** Large `blur` effect circles; purple on top-left, cyan on bottom-right.

**2. Animations:**
- "Fade in / Fade out" and slight upward slide (`y` axis) effects using `AnimatePresence` during page transitions.
- Blur clearing animation when transitioning from Login screen to Dashboard.
- Neon shadow (`box-shadow`) glow on buttons and cards on hover.

**3. Pages/Modules:**
- **Login:** Simple, centered login form with a neon border.
- **Dashboard:** Main summary screen.
- **NeonTicker:** Scrolling text strip at the bottom (For Announcements).
- Create placeholders or simple lists for other pages (Employees, Jobs, etc.) for now.

### 📝 Coding Requests
1. First, create the `tailwind.config.js` file with the color and font definitions above.
2. Add custom scrollbar and neon utility classes into the global CSS (`index.css`).
3. Write the `App.tsx` file including all routing logic, header structure, and background effects.
4. Ensure the code is bug-free, modular, and ready to run immediately.

### 🔗 Backend Data Models (Interfaces)

Please use these TypeScript interfaces to ensure the frontend matches the backend DTOs exactly.

```typescript
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  departmentId: string;
  departmentName: string;
  jobTitle: string;
  managerId?: string;
  status: string;
  currentSalary: number;
  hireDate: string;
  terminationDate?: string;
  avatarUrl: string;
  skills: string[];
}

export interface Department {
  id: string;
  name: string;
  description: string;
  jobs: Job[];
}

export interface Job {
  id: number;
  title: string;
  minSalary: number;
  maxSalary: number;
  departmentId: number;
  departmentName?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  expiryDate: string;
}

export interface JobApplication {
  id: string;
  candidateId: string;
  candidate: Candidate;
  position: string;
  departmentId: string;
  status: string;
  interviewNotes?: string;
  expectedSalary: number;
  matchScore: number;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  skills: string[];
  linkedInUrl: string;
  resumeUrl: string;
  avatarUrl: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
}
```
