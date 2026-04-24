import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Edit2, Trash2, BookMarked } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api/' });
api.interceptors.request.use(c => { const t = localStorage.getItem('access_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

const COLORS = ['emerald','blue','green','orange','pink','cyan'];
const COURSE_COLORS = {
  emerald: 'from-emerald-500 to-emerald-700', blue: 'from-blue-500 to-blue-700',
  green: 'from-emerald-500 to-emerald-700', orange: 'from-orange-500 to-orange-600',
  pink: 'from-pink-500 to-pink-700', cyan: 'from-cyan-500 to-cyan-700',
};

const EnrolledCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code:'', name:'', professor:'', days:'', start_time:'', end_time:'', room:'', color:'blue' });

  const isStaff = localStorage.getItem('user_role') === 'admin';

  const fetch = async () => { setLoading(true); const r = await api.get('courses/?all=true'); setCourses(r.data.results || r.data); setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const save = async (e) => { e.preventDefault(); await api.post('courses/', form); fetch(); setShowModal(false); setForm({ code:'', name:'', professor:'', days:'', start_time:'', end_time:'', room:'', color:'blue' }); };
  const del = async (id) => { await api.delete(`courses/${id}/`); fetch(); };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><BookMarked className="text-teal-500" size={24} /> Enrolled Courses</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">All active courses with class details.</p>
        </div>
        {isStaff && (
          <motion.button onClick={() => setShowModal(true)} whileHover={{ scale: 1.02 }} className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg">
            <Plus size={18} /> Add Course
          </motion.button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">{[...Array(4)].map((_,i) => <div key={i} className="h-52 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}</div>
      ) : courses.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center text-slate-500">No courses yet. Click "Add Course" to enroll.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map((c, i) => {
            const grad = COURSE_COLORS[c.color] || COURSE_COLORS.blue;
            return (
              <motion.div key={c.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}
                className={`bg-gradient-to-br ${grad} rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all`}>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold opacity-80 bg-white/20 px-2 py-0.5 rounded-lg">{c.code}</p>
                  {isStaff && <button onClick={() => del(c.id)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all"><Trash2 size={12} /></button>}
                </div>
                <h4 className="font-bold text-lg mb-4 leading-tight">{c.name}</h4>
                <div className="space-y-2 text-xs opacity-90">
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

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Add New Course</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={18} /></button>
              </div>
              <form onSubmit={save} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Course Code</label><input required value={form.code} onChange={e=>setForm({...form,code:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. CS201" /></div>
                  <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Card Color</label>
                    <select value={form.color} onChange={e=>setForm({...form,color:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none">
                      {COLORS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                    </select></div>
                </div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Course Name</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Advanced Web Design" /></div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Professor</label><input required value={form.professor} onChange={e=>setForm({...form,professor:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Dr. Johnson" /></div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Class Days</label><input required value={form.days} onChange={e=>setForm({...form,days:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Tuesday & Thursday" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Start Time</label><input type="time" required value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" /></div>
                  <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">End Time</label><input type="time" required value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" /></div>
                </div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Room / Lab</label><input required value={form.room} onChange={e=>setForm({...form,room:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Computer Lab B" /></div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-bold">Save Course</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnrolledCourses;
