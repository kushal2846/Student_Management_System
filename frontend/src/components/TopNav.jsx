import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Sun, Moon, Clock, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api/' });
api.interceptors.request.use(c => { const t = localStorage.getItem('access_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

const TopNav = ({ title }) => {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('search_history') || '[]'));
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  const notifications = [
    { id: 1, text: "System maintenance scheduled for midnight", time: "2h ago", unread: true },
    { id: 2, text: "New Grade Reports published for CS101", time: "5h ago", unread: true },
    { id: 3, text: "Welcome to the new Student Management Portal!", time: "1d ago", unread: false },
  ];
  
  const userName = localStorage.getItem('user_name') || 'Admin';
  const roleDisplay = localStorage.getItem('user_role') === 'admin' ? 'A' : 'S';

  const toggleDark = () => {
    const htmlClasses = document.documentElement.classList;
    if (htmlClasses.contains('dark')) {
      htmlClasses.remove('dark'); localStorage.theme = 'light'; setIsDark(false);
    } else {
      htmlClasses.add('dark'); localStorage.theme = 'dark'; setIsDark(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = e => { 
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!search.trim()) { setSuggestions([]); return; }
    const delay = setTimeout(async () => {
      try { const res = await api.get(`students/?search=${search}`); setSuggestions(res.data.results || res.data); } catch (e) {}
    }, 300);
    return () => clearTimeout(delay);
  }, [search]);

  const handleSelectSearch = (term) => {
    const newHist = [term, ...history.filter(h => h !== term)].slice(0, 5);
    setHistory(newHist); localStorage.setItem('search_history', JSON.stringify(newHist));
    setSearch(''); setShowDropdown(false);
    navigate(`/students?search=${term}`);
  };

  return (
    <div className="flex items-center justify-between py-4 px-2 mb-4 relative z-50">
      <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
        <button onClick={() => window.dispatchEvent(new Event('toggleMenu'))} className="md:hidden p-1 text-slate-500 hover:text-teal-600"><Menu size={24} /></button>
        {title}
      </h1>
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative" ref={dropdownRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" placeholder="Search students..." value={search}
            onChange={e => setSearch(e.target.value)} onFocus={() => setShowDropdown(true)}
            onKeyDown={e => { if (e.key === 'Enter' && search.trim()) handleSelectSearch(search); }}
            className="pl-10 pr-4 py-2 text-sm rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none w-64 transition-all"
          />
          <AnimatePresence>
            {showDropdown && (
              <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="absolute top-11 left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                {!search.trim() && history.length > 0 && (
                  <div className="p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1"><Clock size={10} className="inline mr-1" /> Recent Searches</p>
                    {history.map((h, i) => <button key={i} onClick={() => handleSelectSearch(h)} className="w-full text-left px-2 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">{h}</button>)}
                  </div>
                )}
                {search.trim() && suggestions.length > 0 && (
                  <div className="p-2 max-h-64 overflow-y-auto">
                    <p className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1">Results</p>
                    {suggestions.map(s => (
                      <button key={s.id} onClick={() => handleSelectSearch(s.first_name)} className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex justify-between items-center gap-2">
                        <span className="truncate">{s.first_name} {s.last_name}</span><span className="text-[10px] bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 px-1.5 py-0.5 rounded font-bold">{s.student_id}</span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Theme & Notifications */}
        <button onClick={toggleDark} className="p-2 hidden sm:block rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all">{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
        
        <div className="relative" ref={notifRef}>
          <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 relative rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800"></span>
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div initial={{opacity:0, y:-10, scale: 0.95}} animate={{opacity:1, y:0, scale: 1}} exit={{opacity:0, y:-10, scale: 0.95}} className="absolute top-12 right-0 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-[60]">
                 <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                   <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Notifications</h4>
                   <button className="text-[10px] text-teal-600 dark:text-teal-400 font-bold hover:underline">Mark all read</button>
                 </div>
                 <div className="max-h-80 overflow-y-auto">
                   {notifications.map(n => (
                     <div key={n.id} className={`p-4 border-b border-slate-50 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${n.unread ? 'bg-slate-50/10 dark:bg-slate-800/30' : ''}`}>
                       <div className="flex gap-3 items-start">
                         <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.unread ? 'bg-teal-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-transparent'}`} />
                         <div>
                           <p className={`text-sm ${n.unread ? 'font-bold text-slate-800 dark:text-slate-100' : 'font-medium text-slate-600 dark:text-slate-400'}`}>{n.text}</p>
                           <p className="text-[10px] font-bold text-slate-400 mt-1">{n.time}</p>
                         </div>
                       </div>
                     </div>
                   ))}
                   <button className="w-full p-3 text-xs font-bold text-teal-600 dark:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-center">View all notifications</button>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm select-none shadow-md" title={userName}>{roleDisplay}</div>
      </div>
    </div>
  );
};
export default TopNav;
