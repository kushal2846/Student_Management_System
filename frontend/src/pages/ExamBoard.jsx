import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, ClipboardList } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api/' });
api.interceptors.request.use(c => { const t = localStorage.getItem('access_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

const STATUS_OPTIONS = ['Upcoming', 'Completed', 'Cancelled'];

const statusColor = (s) => ({
  Upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}[s] || 'bg-slate-100 text-slate-600');

const ExamBoard = () => {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ course: '', name: '', date: '', time: '', location: '', status: 'Upcoming' });

  const isStaff = localStorage.getItem('user_role') === 'admin';

  const fetch = async () => {
    setLoading(true);
    const [e, c] = await Promise.all([api.get('exams/?all=true'), api.get('courses/?all=true')]);
    setExams(e.data.results || e.data);
    setCourses(c.data.results || c.data);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const save = async (e) => { e.preventDefault(); await api.post('exams/', form); fetch(); setShowModal(false); setForm({ course: '', name: '', date: '', time: '', location: '', status: 'Upcoming' }); };
  const del = async (id) => { await api.delete(`exams/${id}/`); fetch(); };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><ClipboardList className="text-teal-500" size={24} /> Exam Board</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track all upcoming and past examinations.</p>
        </div>
        {isStaff && (
          <motion.button onClick={() => setShowModal(true)} whileHover={{ scale: 1.02 }} className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg">
            <Plus size={18} /> Add Exam
          </motion.button>
        )}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
            {['Exam Name','Course','Date','Time','Location','Status',''].map(h => <th key={h} className="py-4 px-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>)}
          </tr></thead>
          <tbody>
            {loading ? [...Array(3)].map((_, i) => (
              <tr key={i} className="animate-pulse border-b border-slate-100 dark:border-slate-800">
                {[...Array(7)].map((_, j) => <td key={j} className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" /></td>)}
              </tr>
            )) : exams.length === 0 ? (
              <tr><td colSpan="7" className="py-10 text-center text-slate-500">No exams yet. Click "Add Exam" to get started.</td></tr>
            ) : exams.map(e => (
              <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="py-3 px-5 font-semibold text-slate-800 dark:text-slate-100">{e.name}</td>
                <td className="py-3 px-5 text-slate-500 dark:text-slate-400 text-sm">{e.course_name} ({e.course_code})</td>
                <td className="py-3 px-5 text-slate-600 dark:text-slate-300 text-sm">{e.date}</td>
                <td className="py-3 px-5 text-slate-600 dark:text-slate-300 text-sm">{e.time}</td>
                <td className="py-3 px-5 text-slate-600 dark:text-slate-300 text-sm">{e.location}</td>
                <td className="py-3 px-5"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusColor(e.status)}`}>{e.status}</span></td>
                <td className="py-3 px-5">{isStaff && <button onClick={() => del(e.id)} className="p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 transition-all"><Trash2 size={14} /></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Add New Exam</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={18} /></button>
              </div>
              <form onSubmit={save} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Course</label>
                  <select required value={form.course} onChange={e => setForm({...form, course: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none">
                    <option value="">-- Select Course --</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Exam Name</label><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Midterm Exam" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Date</label><input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" /></div>
                  <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Time</label><input type="time" required value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" /></div>
                </div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Location</label><input required value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Hall A" /></div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none">{STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-bold">Save Exam</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExamBoard;
