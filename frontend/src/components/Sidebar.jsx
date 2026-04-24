import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, ClipboardList, BookOpen, BarChart2,
  BookMarked, Map, UserCheck, Library, DollarSign, Megaphone,
  Settings, Bell, LogOut, GraduationCap
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen(p => !p);
    window.addEventListener('toggleMenu', handleToggle);
    return () => window.removeEventListener('toggleMenu', handleToggle);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={() => { if(window.innerWidth < 768) setIsOpen(false); }}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
        ${isActive
          ? 'bg-white/15 text-white shadow-sm'
          : 'text-slate-400 hover:bg-white/10 hover:text-white'}`
      }
    >
      <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      <div className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)} />

      {/* Sidebar Content */}
      <div className={`fixed top-0 left-0 h-screen w-64 bg-[#0f1535] flex flex-col z-50 border-r border-white/10 overflow-y-auto transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Student</p>
          <p className="text-white font-bold text-sm leading-tight">Management System</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-6">
        {/* Main */}
        <div>
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
        </div>

        {/* ACADEMIC */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-4 mb-2">Academic</p>
          <NavItem to="/schedule" icon={Calendar} label="Schedule" />
          <NavItem to="/exams" icon={ClipboardList} label="Exam Board" />
          <NavItem to="/homeworks" icon={BookOpen} label="Homeworks" />
          <NavItem to="/grades" icon={BarChart2} label="Grade Report" />
          <NavItem to="/courses" icon={BookMarked} label="Enrolled Courses" />
          <NavItem to="/course-plan" icon={Map} label="Course Plan" />
          <NavItem to="/attendance" icon={UserCheck} label="Attendance" />
          <NavItem to="/library" icon={Library} label="Libraries" />
        </div>

        {/* ADMINISTRATIVE */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-4 mb-2">Administrative</p>
          <NavItem to="/finance" icon={DollarSign} label="Finance" />
          <NavItem to="/announcements" icon={Megaphone} label="Announcements" />
        </div>

        {/* SETTINGS */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-4 mb-2">Settings</p>
          <NavItem to="/account-settings" icon={Settings} label="Account Settings" />
          <NavItem to="/notifications" icon={Bell} label="Notification Preferences" />
        </div>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all w-full"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
