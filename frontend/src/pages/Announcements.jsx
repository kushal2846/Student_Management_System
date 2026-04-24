import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Megaphone, Pin } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api/' });
api.interceptors.request.use(c => { const t = localStorage.getItem('access_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

const Announcements = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title:'', body:'', author:'Admin', is_pinned:false });

  const isStaff = localStorage.getItem('user_role') === 'admin';

  const fetch = async () => { setLoading(true); const r = await api.get('announcements/?all=true'); setItems(r.data.results || r.data); setLoading(false); };
  useEffect(() => { fetch(); }, []);
  const save = async (e) => { e.preventDefault(); await api.post('announcements/', form); fetch(); setShowModal(false); setForm({ title:'', body:'', author:'Admin', is_pinned:false }); };
  const del = async (id) => { await api.delete(`announcements/${id}/`); fetch(); };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Megaphone className="text-teal-500" size={24} /> Announcements</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">School-wide broadcasts and important notices.</p>
        </div>
        {isStaff && (
          <motion.button onClick={() => setShowModal(true)} whileHover={{ scale: 1.02 }} className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg"><Plus size={18} /> Post Announcement</motion.button>
        )}
      </div>

      {loading ? <div className="space-y-4">{[...Array(3)].map((_,i) => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}</div> :
      items.length === 0 ? <div className="glass rounded-2xl p-16 text-center text-slate-500">No announcements yet.</div> :
      <div className="space-y-4">
        {items.map((a, i) => (
          <motion.div key={a.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
            className={`glass rounded-2xl p-6 border-l-4 ${a.is_pinned ? 'border-teal-500' : 'border-slate-200 dark:border-slate-700'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {a.is_pinned && <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1 rounded-full">📌 Pinned</span>}
                  <span className="text-xs text-slate-400 dark:text-slate-500">By {a.author} • {new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{a.title}</h4>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{a.body}</p>
              </div>
              {isStaff && <button onClick={() => del(a.id)} className="p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 flex-shrink-0"><Trash2 size={14} /></button>}
            </div>
          </motion.div>
        ))}
      </div>}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Post Announcement</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={18} /></button>
              </div>
              <form onSubmit={save} className="p-6 space-y-4">
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Title</label><input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Announcement title" /></div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Message</label><textarea required rows={4} value={form.body} onChange={e=>setForm({...form,body:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none resize-none" placeholder="Write your message..." /></div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Author</label><input value={form.author} onChange={e=>setForm({...form,author:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" /></div>
                <div className="flex items-center gap-3"><input type="checkbox" id="pin" checked={form.is_pinned} onChange={e=>setForm({...form,is_pinned:e.target.checked})} className="w-4 h-4 accent-teal-600" /><label htmlFor="pin" className="text-sm font-bold text-slate-700 dark:text-slate-300">📌 Pin this announcement</label></div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-bold">Post</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Announcements;
