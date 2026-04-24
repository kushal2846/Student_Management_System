import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import Overview from './Overview';
import StudentList from './StudentList';
import Academics from './Academics';
import Schedule from './Schedule';
import ExamBoard from './ExamBoard';
import Homeworks from './Homeworks';
import EnrolledCourses from './EnrolledCourses';
import CoursePlan from './CoursePlan';
import LibraryPage from './LibraryPage';
import Finance from './Finance';
import Announcements from './Announcements';
import AccountSettings from './AccountSettings';

const titleMap = {
  '/': 'Dashboard',
  '/students': 'Student Directory',
  '/grades': 'Grade Report & Analytics',
  '/schedule': 'Weekly Schedule',
  '/exams': 'Exam Board',
  '/homeworks': 'Homeworks',
  '/courses': 'Enrolled Courses',
  '/course-plan': 'Course Plan',
  '/attendance': 'Attendance',
  '/library': 'Libraries',
  '/finance': 'Finance',
  '/announcements': 'Announcements',
  '/account-settings': 'Account Settings',
  '/notifications': 'Notification Preferences',
};

const ComingSoon = ({ title }) => (
  <div className="glass p-16 rounded-3xl text-center">
    <h1 className="text-2xl font-bold text-slate-700 dark:text-slate-100">{title}</h1>
    <p className="text-slate-500 dark:text-slate-400 mt-2">This module is under construction.</p>
  </div>
);

const Dashboard = () => {
  const location = useLocation();
  const currentTitle = titleMap[location.pathname] || 'Dashboard';

  // Apply saved theme on mount
  React.useEffect(() => {
    const saved = localStorage.theme;
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 w-full md:ml-64 px-4 py-6 md:p-6 relative z-10 overflow-x-hidden">
        <TopNav title={currentTitle} />
        <main className="w-full">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/students" element={<StudentList />} />
            <Route path="/grades" element={<Academics />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/exams" element={<ExamBoard />} />
            <Route path="/homeworks" element={<Homeworks />} />
            <Route path="/courses" element={<EnrolledCourses />} />
            <Route path="/course-plan" element={<CoursePlan />} />
            <Route path="/attendance" element={<StudentList />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/account-settings" element={<AccountSettings />} />
            <Route path="/notifications" element={<ComingSoon title="Notification Preferences" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
