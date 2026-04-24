import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Calendar } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api/' });
api.interceptors.request.use(c => { const t = localStorage.getItem('access_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

const DAYS = [['Mon','Monday'],['Tue','Tuesday'],['Wed','Wednesday'],['Thu','Thursday'],['Fri','Friday']];
const DAY_COLORS = { Mon:'from-blue-500 to-blue-700', Tue:'from-emerald-500 to-emerald-700', Wed:'from-emerald-500 to-emerald-700', Thu:'from-orange-500 to-orange-600', Fri:'from-pink-500 to-pink-700' };

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ course:'', weekday:'Mon', start_time:'', end_time:'', room:'' });

  const isStaff = localStorage.getItem('user_role') === 'admin';

  const fetch = async () => { setLoading(true); const [s, c] = await Promise.all([api.get('schedule/?all=true'), api.get('courses/?all=true')]); setSchedule(s.data.results || s.data); setCourses(c.data.results || c.data); setLoading(false); };
  useEffect(() => { fetch(); }, []);
  const save = async (e) => { e.preventDefault(); await api.post('schedule/', form); fetch(); setShowModal(false); setForm({ course:'', weekday:'Mon', start_time:'', end_time:'', room:'' }); };
  const del = async (id) => { await api.delete(`schedule/${id}/`); fetch(); };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Calendar className="text-teal-500" size={24} /> Weekly Schedule</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Your class timetable for the week.</p>
        </div>
        {isStaff && (
          <motion.button onClick={() => setShowModal(true)} whileHover={{ scale: 1.02 }} className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg">
            <Plus size={18} /> Add Class
          </motion.button>
        )}
      </div>

      {loading ? <div className="grid grid-cols-5 gap-4">{[...Array(5)].map((_,i) => <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}</div> : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {DAYS.map(([abbr, full]) => {
            const dayClasses = schedule.filter(s => s.weekday === abbr);
            return (
              <div key={abbr} className="space-y-3">
                <div className={`bg-gradient-to-br ${DAY_COLORS[abbr]} rounded-xl px-3 py-2 text-white text-center`}>
                  <p className="font-bold text-sm">{full}</p>
                </div>
                {dayClasses.length === 0 ? (
                  <div className="glass rounded-xl p-4 text-center text-slate-400 dark:text-slate-500 text-xs">No classes</div>
                ) : dayClasses.map(s => (
                  <div key={s.id} className="glass rounded-xl p-3 relative group">
                    <p className="text-xs font-bold text-teal-600 dark:text-teal-400">{s.course_code}</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5 leading-tight">{s.course_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.start_time} – {s.end_time}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">📍 {s.room}</p>
                    {isStaff && <button onClick={() => del(s.id)} className="absolute top-2 right-2 p-1 text-red-500 bg-red-50 dark:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10} /></button>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Add Class to Schedule</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={18} /></button>
              </div>
              <form onSubmit={save} className="p-6 space-y-4">
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Course</label>
                  <select required value={form.course} onChange={e=>setForm({...form,course:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none">
                    <option value="">-- Select Course --</option>
                    {courses.map(c=><option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                  </select></div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Day</label>
                  <select value={form.weekday} onChange={e=>setForm({...form,weekday:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none">
                    {DAYS.map(([a,f])=><option key={a} value={a}>{f}</option>)}
                  </select></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Start Time</label><input type="time" required value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" /></div>
                  <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">End Time</label><input type="time" required value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" /></div>
                </div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Room</label><input required value={form.room} onChange={e=>setForm({...form,room:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Lab B" /></div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-bold">Save Class</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Schedule;
