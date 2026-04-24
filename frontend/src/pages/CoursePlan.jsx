import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Map } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api/' });
api.interceptors.request.use(c => { const t = localStorage.getItem('access_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

const CoursePlan = () => {
  const [plans, setPlans] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ course:'', semester:'Spring', year: new Date().getFullYear(), completed:false });

  const isStaff = localStorage.getItem('user_role') === 'admin';

  const fetch = async () => { setLoading(true); const [p, c] = await Promise.all([api.get('course-plans/?all=true'), api.get('courses/?all=true')]); setPlans(p.data.results || p.data); setCourses(c.data.results || c.data); setLoading(false); };
  useEffect(() => { fetch(); }, []);
  const save = async (e) => { e.preventDefault(); await api.post('course-plans/', form); fetch(); setShowModal(false); setForm({ course:'', semester:'Spring', year: new Date().getFullYear(), completed:false }); };
  const del = async (id) => { await api.delete(`course-plans/${id}/`); fetch(); };
  const toggleComplete = async (p) => { await api.patch(`course-plans/${p.id}/`, { completed: !p.completed }); fetch(); };

  const grouped = ['Fall','Spring','Summer'].reduce((acc, s) => { acc[s] = plans.filter(p => p.semester === s); return acc; }, {});

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Map className="text-teal-500" size={24} /> Course Plan</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Semester-wise academic road map.</p>
        </div>
        {isStaff && <motion.button onClick={() => setShowModal(true)} whileHover={{ scale: 1.02 }} className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg"><Plus size={18} /> Add Plan</motion.button>}
      </div>

      {loading ? <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_,i)=><div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}</div> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(grouped).map(([sem, semPlans]) => (
            <div key={sem} className="glass rounded-2xl p-5">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 text-base border-b border-slate-100 dark:border-slate-700 pb-3">{sem} Semester</h3>
              {semPlans.length === 0 ? <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-4">No courses planned.</p> :
              <div className="space-y-3">
                {semPlans.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-teal-500">{p.course_code} · {p.year}</p>
                      <p className={`text-sm font-semibold ${p.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{p.course_name}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 items-end">
                      <button onClick={() => toggleComplete(p)} className={`px-2 py-1 rounded-lg text-[10px] font-bold ${p.completed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>{p.completed ? '✓ Done' : 'In Progress'}</button>
                      {isStaff && <button onClick={() => del(p.id)} className="p-1.5 text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"><Trash2 size={11} /></button>}
                    </div>
                  </div>
                ))}
              </div>}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Add to Course Plan</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={18} /></button>
              </div>
              <form onSubmit={save} className="p-6 space-y-4">
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Course</label>
                  <select required value={form.course} onChange={e=>setForm({...form,course:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none">
                    <option value="">-- Select Course --</option>
                    {courses.map(c=><option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                  </select></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Semester</label>
                    <select value={form.semester} onChange={e=>setForm({...form,semester:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none">
                      {['Fall','Spring','Summer'].map(s=><option key={s} value={s}>{s}</option>)}
                    </select></div>
                  <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Year</label><input type="number" required value={form.year} onChange={e=>setForm({...form,year:parseInt(e.target.value)})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" /></div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-bold">Add Course</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default CoursePlan;
