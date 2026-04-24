import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Library } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api/' });
api.interceptors.request.use(c => { const t = localStorage.getItem('access_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

const statusColor = (s) => ({
  Available: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Borrowed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Returned: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}[s] || 'bg-slate-100 text-slate-600');

const LibraryPage = () => {
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title:'', author:'', isbn:'', borrowed_by:'', borrow_date:'', return_date:'', status:'Available' });

  const isStaff = localStorage.getItem('user_role') === 'admin';

  const fetch = async () => { setLoading(true); const [b, s] = await Promise.all([api.get('library/?all=true'), api.get('students/?all=true')]); setBooks(b.data.results || b.data); setStudents(s.data.results || s.data); setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const save = async (e) => { e.preventDefault(); const payload = {...form, borrowed_by: form.borrowed_by || null}; await api.post('library/', payload); fetch(); setShowModal(false); setForm({ title:'', author:'', isbn:'', borrowed_by:'', borrow_date:'', return_date:'', status:'Available' }); };
  const del = async (id) => { await api.delete(`library/${id}/`); fetch(); };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Library className="text-teal-500" size={24} /> Libraries</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track all library books – borrowed, available, and returned.</p>
        </div>
        {isStaff && <motion.button onClick={() => setShowModal(true)} whileHover={{ scale: 1.02 }} className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg"><Plus size={18} /> Add Book</motion.button>}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
            {['Title','Author','ISBN','Borrowed By','Borrow Date','Return Date','Status',''].map(h => <th key={h} className="py-4 px-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>)}
          </tr></thead>
          <tbody>
            {loading ? [...Array(3)].map((_,i) => <tr key={i} className="animate-pulse border-b border-slate-100 dark:border-slate-800">{[...Array(8)].map((_,j) => <td key={j} className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" /></td>)}</tr>) :
            books.length === 0 ? <tr><td colSpan="8" className="py-10 text-center text-slate-500">No books yet.</td></tr> :
            books.map(b => (
              <tr key={b.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="py-3 px-5 font-semibold text-slate-800 dark:text-slate-100">{b.title}</td>
                <td className="py-3 px-5 text-slate-600 dark:text-slate-300 text-sm">{b.author}</td>
                <td className="py-3 px-5 text-slate-500 dark:text-slate-400 text-sm">{b.isbn || '–'}</td>
                <td className="py-3 px-5 text-slate-600 dark:text-slate-300 text-sm">{b.borrowed_by_name || '–'}</td>
                <td className="py-3 px-5 text-slate-500 text-sm">{b.borrow_date || '–'}</td>
                <td className="py-3 px-5 text-slate-500 text-sm">{b.return_date || '–'}</td>
                <td className="py-3 px-5"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusColor(b.status)}`}>{b.status}</span></td>
                <td className="py-3 px-5">{isStaff && <button onClick={() => del(b.id)} className="p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100"><Trash2 size={14} /></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Add Book</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={18} /></button>
              </div>
              <form onSubmit={save} className="p-6 space-y-4">
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Book Title</label><input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Clean Code" /></div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Author</label><input required value={form.author} onChange={e=>setForm({...form,author:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Robert C. Martin" /></div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">ISBN</label><input value={form.isbn} onChange={e=>setForm({...form,isbn:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Optional" /></div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Borrowed By (Optional)</label>
                  <select value={form.borrowed_by} onChange={e=>setForm({...form,borrowed_by:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none">
                    <option value="">-- Not Borrowed --</option>
                    {students.map(s=><option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                  </select></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Borrow Date</label><input type="date" value={form.borrow_date} onChange={e=>setForm({...form,borrow_date:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" /></div>
                  <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Return Date</label><input type="date" value={form.return_date} onChange={e=>setForm({...form,return_date:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" /></div>
                </div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                  <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none">
                    {['Available','Borrowed','Returned'].map(s=><option key={s} value={s}>{s}</option>)}
                  </select></div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-bold">Save Book</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LibraryPage;
