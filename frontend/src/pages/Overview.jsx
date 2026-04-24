import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, BookOpen, ClipboardList, Megaphone, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api/' });
api.interceptors.request.use(c => {
  const t = localStorage.getItem('access_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

const COURSE_COLORS = {
  emerald: 'from-emerald-500 to-emerald-700',
  blue: 'from-blue-500 to-blue-700',
  green: 'from-emerald-500 to-emerald-700',
  orange: 'from-orange-500 to-orange-600',
  pink: 'from-pink-500 to-pink-700',
  cyan: 'from-cyan-500 to-cyan-700',
};

// Dynamic data computation is inside the component

const MiniCalendar = () => {
  const now = new Date();
  const [current, setCurrent] = useState({ month: now.getMonth(), year: now.getFullYear() });
  const firstDay = new Date(current.year, current.month, 1).getDay();
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const days = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const cells = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)];

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCurrent(p => ({ ...p, month: p.month === 0 ? 11 : p.month - 1, year: p.month === 0 ? p.year - 1 : p.year }))} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors text-sm">‹</button>
        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{months[current.month]} {current.year}</span>
        <button onClick={() => setCurrent(p => ({ ...p, month: p.month === 11 ? 0 : p.month + 1, year: p.month === 11 ? p.year + 1 : p.year }))} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors text-sm">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map(d => <div key={d} className="text-[10px] font-bold text-slate-400 py-1">{d}</div>)}
        {cells.map((day, i) => (
          <div key={i} className={`text-xs py-1 rounded-lg font-medium cursor-pointer transition-colors
            ${day === now.getDate() && current.month === now.getMonth() && current.year === now.getFullYear()
              ? 'bg-teal-600 text-white'
              : day ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700' : ''}`}>
            {day || ''}
          </div>
        ))}
      </div>
    </div>
  );
};

const Overview = () => {
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [homeworks, setHomeworks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  
  const userRole = localStorage.getItem('user_role') === 'admin' ? 'Administrator' : 'Student';
  const userName = localStorage.getItem('user_name') || 'User';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    const msg = localStorage.getItem('login_toast');
    if (msg) {
      setToastMsg(msg);
      localStorage.removeItem('login_toast');
      setTimeout(() => setToastMsg(''), 3500);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('courses/?all=true'),
      api.get('exams/?all=true'),
      api.get('homeworks/?all=true'),
      api.get('announcements/?all=true'),
      api.get('students/?all=true'),
      api.get('attendance/?all=true'),
    ]).then(([c, e, h, a, s, att]) => {
      setCourses(c.data.results || c.data);
      setExams(e.data.results || e.data);
      setHomeworks(h.data.results || h.data);
      setAnnouncements(a.data.results || a.data);
      setStudents(s.data.results || s.data);
      setAttendances(att.data.results || att.data);
    }).finally(() => setLoading(false));
  }, []);

  const gradeData = React.useMemo(() => {
    const counts = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'F': 0 };
    let total = 0;
    students.forEach(s => {
      if (counts[s.grade_letter] !== undefined) {
        counts[s.grade_letter]++;
        total++;
      }
    });
    return [
      { name: 'A', count: counts['A'], percentage: total ? Math.round((counts['A']/total)*100) : 0 },
      { name: 'B', count: counts['B'], percentage: total ? Math.round((counts['B']/total)*100) : 0 },
      { name: 'C', count: counts['C'], percentage: total ? Math.round((counts['C']/total)*100) : 0 },
      { name: 'D', count: counts['D'], percentage: total ? Math.round((counts['D']/total)*100) : 0 },
      { name: 'E', count: counts['E'], percentage: total ? Math.round((counts['E']/total)*100) : 0 },
      { name: 'F', count: counts['F'], percentage: total ? Math.round((counts['F']/total)*100) : 0 },
    ];
  }, [students]);

  const branchData = React.useMemo(() => {
    const counts = {};
    students.forEach(s => {
      counts[s.course] = (counts[s.course] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [students]);
  
  const PIE_COLORS = ['#0d9488', '#059669', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

  const attendanceData = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const stats = {};
    months.forEach((m, idx) => {
      stats[idx] = { name: m, total: 0, present: 0 };
    });
    
    attendances.forEach(att => {
      if (!att.date) return;
      const d = new Date(att.date);
      if (d.getFullYear() !== selectedYear) return;
      const mIdx = d.getMonth();
      if (stats[mIdx]) {
        stats[mIdx].total++;
        if (att.is_present) stats[mIdx].present++;
      }
    });

    return months.map((m, idx) => ({
      name: m,
      percentage: stats[idx].total > 0 ? Math.round((stats[idx].present / stats[idx].total) * 100) : 0
    }));
  }, [attendances, selectedYear]);

  const availableYears = React.useMemo(() => {
    const years = new Set(attendances.map(a => new Date(a.date).getFullYear()).filter(y => !isNaN(y)));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a,b)=>b-a);
  }, [attendances]);

  const statusBadge = (status) => {
    const map = {
      Upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
      Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      Submitted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      Overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    };
    return map[status] || 'bg-slate-100 text-slate-600';
  };

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i) => <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6 pb-10 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 50 }} 
            className="fixed bottom-10 right-10 z-[100] bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">👋</div>
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Banner */}
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 via-emerald-600 to-blue-600 p-8 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute right-20 bottom-0 w-40 h-40 bg-white/5 rounded-full blur-xl" />
        <div className="relative">
          <p className="text-teal-200 text-sm font-medium mb-1 tracking-widest uppercase">{userRole} Dashboard</p>
          <h2 className="text-3xl font-bold mb-1">Welcome, {userName}!</h2>
          <p className="text-teal-200 text-sm mb-4">{today}</p>
          <div className="flex gap-3">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
              <Users size={16} /> {students.length} Students Enrolled
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
              <ClipboardList size={16} /> {exams.filter(e=>e.status==='Upcoming').length} Upcoming Exams
            </div>
          </div>
        </div>
      </motion.div>

      {/* Analytics Dashboard */}
      {userRole === 'Administrator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800/60 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">College Attendance</h3>
               <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="text-sm font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-1 px-2 rounded-lg outline-none appearance-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                 {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
               </select>
             </div>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={attendanceData}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} dx={-10} />
                   <RechartsTooltip cursor={{ stroke: '#2dd4bf', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: '#ffffff', color: '#1e293b', fontWeight: 'bold' }} />
                   <Line type="monotone" dataKey="percentage" stroke="#0d9488" strokeWidth={4} dot={{ r: 4, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                 </LineChart>
               </ResponsiveContainer>
             </div>
          </div>
          <div className="bg-white dark:bg-slate-800/60 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
             <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Grade Distribution</h3>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={gradeData}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} dx={-10} />
                   <RechartsTooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} formatter={(value, name, props) => [`${value} Students (${props.payload.percentage}%)`, 'Grades']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: '#ffffff', color: '#1e293b', fontWeight: 'bold' }} />
                   <Bar dataKey="count" fill="#059669" radius={[6, 6, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
          <div className="bg-white dark:bg-slate-800/60 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
             <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Students By Branch</h3>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie data={branchData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                     {branchData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                   </Pie>
                   <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: '#ffffff', color: '#1e293b', fontWeight: 'bold' }} />
                 </PieChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Enrolled Courses */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><BookOpen size={18} className="text-teal-500" /> Enrolled Courses</h3>
              <Link to="/courses" className="text-teal-600 dark:text-teal-400 text-sm font-semibold flex items-center gap-1 hover:underline">View all <ChevronRight size={14} /></Link>
            </div>
            {courses.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-slate-500">No courses yet. <Link to="/courses" className="text-teal-500 font-semibold">Add a course →</Link></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courses.slice(0,4).map((c, i) => {
                  const grad = COURSE_COLORS[c.color] || COURSE_COLORS.blue;
                  return (
                    <motion.div key={c.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}
                      className={`bg-gradient-to-br ${grad} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1`}>
                      <p className="text-xs font-bold opacity-80 mb-1">{c.code}</p>
                      <h4 className="font-bold text-base mb-3 leading-tight">{c.name}</h4>
                      <div className="space-y-1.5 text-xs opacity-90">
                        <p className="flex items-center gap-2">👤 {c.professor}</p>
                        <p className="flex items-center gap-2">📅 {c.days}</p>
                        <p className="flex items-center gap-2">🕐 {c.start_time} – {c.end_time}</p>
                        <p className="flex items-center gap-2">📍 {c.room}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Exam Board Table */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><ClipboardList size={18} className="text-teal-500" /> Exam Board</h3>
              <Link to="/exams" className="text-teal-600 dark:text-teal-400 text-sm font-semibold flex items-center gap-1 hover:underline">View all <ChevronRight size={14} /></Link>
            </div>
            <div className="glass rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                    {['Exam Name','Course','Date','Time','Location','Status'].map(h => (
                      <th key={h} className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exams.length === 0 ? (
                    <tr><td colSpan="6" className="py-6 text-center text-slate-500 text-sm">No exams yet.</td></tr>
                  ) : exams.slice(0,6).map(e => (
                    <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-200 text-sm">{e.name}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-sm">{e.course_code}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-sm">{e.date}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-sm">{e.time}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-sm">{e.location}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusBadge(e.status)}`}>{e.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Calendar + Homeworks */}
        <div className="space-y-6">
          <MiniCalendar />

          {/* Homeworks Panel */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><BookOpen size={16} className="text-teal-500" /> Homeworks</h3>
              <Link to="/homeworks" className="text-teal-600 dark:text-teal-400 text-xs font-semibold flex items-center gap-1 hover:underline">View all <ChevronRight size={12} /></Link>
            </div>
            <div className="space-y-3">
              {homeworks.length === 0 ? (
                <div className="glass rounded-2xl p-6 text-center text-slate-500 text-sm">No homeworks yet.</div>
              ) : homeworks.slice(0,5).map(hw => (
                <div key={hw.id} className="glass rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{hw.course_name}</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">{hw.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Due: {hw.due_date}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex-shrink-0 ${statusBadge(hw.status)}`}>{hw.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements Panel */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Megaphone size={16} className="text-teal-500" /> Announcements</h3>
              <Link to="/announcements" className="text-teal-600 dark:text-teal-400 text-xs font-semibold flex items-center gap-1 hover:underline">View all <ChevronRight size={12} /></Link>
            </div>
            <div className="space-y-3">
              {announcements.slice(0,3).map(a => (
                <div key={a.id} className="glass rounded-xl p-4 border-l-4 border-teal-500">
                  <div className="flex items-center gap-2 mb-1">
                    {a.is_pinned && <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full">📌 Pinned</span>}
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{a.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{a.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
