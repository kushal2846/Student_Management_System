import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, BookOpen } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api/' });
api.interceptors.request.use(c => { const t = localStorage.getItem('access_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

const statusColor = (s) => ({
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Submitted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}[s] || 'bg-slate-100 text-slate-600');

const Homeworks = () => {
  const [homeworks, setHomeworks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ course: '', title: '', description: '', due_date: '', status: 'Pending' });

  const fetch = async () => {
    setLoading(true);
    const [h, c] = await Promise.all([api.get('homeworks/?all=true'), api.get('courses/?all=true')]);
    setHomeworks(h.data.results || h.data);
    setCourses(c.data.results || c.data);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const save = async (e) => { e.preventDefault(); await api.post('homeworks/', form); fetch(); setShowModal(false); setForm({ course: '', title: '', description: '', due_date: '', status: 'Pending' }); };
  const del = async (id) => { await api.delete(`homeworks/${id}/`); fetch(); };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><BookOpen className="text-teal-500" size={24} /> Homeworks</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track assignments and submission status.</p>
        </div>
        <motion.button onClick={() => setShowModal(true)} whileHover={{ scale: 1.02 }} className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg">
          <Plus size={18} /> Add Homework
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />) :
          homeworks.length === 0 ? <div className="col-span-3 glass rounded-2xl p-10 text-center text-slate-500">No homeworks yet. Click "Add Homework" to get started.</div> :
          homeworks.map((hw, i) => (
            <motion.div key={hw.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}} className="glass rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-teal-500">{hw.course_name}</p>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mt-1">{hw.title}</h4>
                </div>
                <button onClick={() => del(hw.id)} className="p-1.5 text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"><Trash2 size={13} /></button>
              </div>
              {hw.description && <p className="text-sm text-slate-500 dark:text-slate-400">{hw.description}</p>}
              <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">Due: <span className="font-bold">{hw.due_date}</span></p>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusColor(hw.status)}`}>{hw.status}</span>
              </div>
            </motion.div>
          ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Add Homework</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={18} /></button>
              </div>
              <form onSubmit={save} className="p-6 space-y-4">
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Course</label>
                  <select required value={form.course} onChange={e => setForm({...form, course: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none">
                    <option value="">-- Select Course --</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                  </select></div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Title</label><input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Assignment title" /></div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none resize-none" placeholder="Optional description..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Due Date</label><input type="date" required value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" /></div>
                  <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none">
                      {['Pending','Submitted','Overdue'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select></div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-bold">Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Homeworks;
