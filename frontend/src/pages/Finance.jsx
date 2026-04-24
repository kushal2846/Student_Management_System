import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, DollarSign } from 'lucide-react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api/' });
api.interceptors.request.use(c => { const t = localStorage.getItem('access_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

const Finance = () => {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ student:'', description:'', record_type:'Fee', amount:'', paid:false, due_date:'' });

  const isStaff = localStorage.getItem('user_role') === 'admin';

  const fetch = async () => { setLoading(true); const [f, s] = await Promise.all([api.get('finance/?all=true'), api.get('students/?all=true')]); setRecords(f.data.results || f.data); setStudents(s.data.results || s.data); setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const save = async (e) => { e.preventDefault(); await api.post('finance/', form); fetch(); setShowModal(false); setForm({ student:'', description:'', record_type:'Fee', amount:'', paid:false, due_date:'' }); };
  const del = async (id) => { await api.delete(`finance/${id}/`); fetch(); };
  const togglePaid = async (r) => { await api.patch(`finance/${r.id}/`, { paid: !r.paid }); fetch(); };

  const totalAmount = records.reduce((s, r) => s + parseFloat(r.amount), 0);
  const paidAmount = records.filter(r => r.paid).reduce((s, r) => s + parseFloat(r.amount), 0);

  const revenueData = React.useMemo(() => {
    let feeSum = 0, fineSum = 0;
    records.forEach(r => {
      if (r.record_type === 'Fee') feeSum += parseFloat(r.amount);
      else if (r.record_type === 'Fine') fineSum += parseFloat(r.amount);
    });
    return [
      { name: 'Tuition Fees', value: feeSum },
      { name: 'Fines', value: fineSum }
    ].filter(d => d.value > 0);
  }, [records]);
  const REV_COLORS = ['#0d9488', '#f43f5e'];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><DollarSign className="text-teal-500" size={24} /> Finance</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track student fee payments and financial records.</p>
        </div>
        {isStaff && (
          <motion.button onClick={() => setShowModal(true)} whileHover={{ scale: 1.02 }} className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg"><Plus size={18} /> Add Record</motion.button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5"><p className="text-sm text-slate-500 dark:text-slate-400">Total Billed</p><p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">₹{totalAmount.toLocaleString()}</p></div>
        <div className="glass rounded-2xl p-5"><p className="text-sm text-slate-500 dark:text-slate-400">Total Paid</p><p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{paidAmount.toLocaleString()}</p></div>
        <div className="glass rounded-2xl p-5"><p className="text-sm text-slate-500 dark:text-slate-400">Outstanding</p><p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">₹{(totalAmount - paidAmount).toLocaleString()}</p></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Revenue Structure</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revenueData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {revenueData.map((entry, index) => <Cell key={`cell-${index}`} fill={REV_COLORS[index % REV_COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => `₹${value.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: '#ffffff', color: '#1e293b', fontWeight: 'bold' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-2 glass rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
            {['Student','Description','Type','Amount','Due Date','Paid',''].map(h => <th key={h} className="py-4 px-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>)}
          </tr></thead>
          <tbody>
            {loading ? [...Array(3)].map((_,i) => <tr key={i} className="animate-pulse border-b border-slate-100 dark:border-slate-800">{[...Array(7)].map((_,j) => <td key={j} className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" /></td>)}</tr>) :
            records.length === 0 ? <tr><td colSpan="7" className="py-10 text-center text-slate-500">No finance records yet.</td></tr> :
            records.map(r => (
              <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="py-3 px-5 font-semibold text-slate-800 dark:text-slate-100">{r.student_name}</td>
                <td className="py-3 px-5 text-slate-600 dark:text-slate-300 text-sm">{r.description}</td>
                <td className="py-3 px-5"><span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">{r.record_type}</span></td>
                <td className="py-3 px-5 font-bold text-slate-800 dark:text-slate-200">₹{parseFloat(r.amount).toLocaleString()}</td>
                <td className="py-3 px-5 text-slate-500 dark:text-slate-400 text-sm">{r.due_date}</td>
                <td className="py-3 px-5">
                  <button disabled={!isStaff} onClick={() => togglePaid(r)} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${r.paid ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'} ${!isStaff && 'opacity-80 cursor-default'}`}>{r.paid ? 'Paid' : 'Unpaid'}</button>
                </td>
                <td className="py-3 px-5">{isStaff && <button onClick={() => del(r.id)} className="p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100"><Trash2 size={14} /></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Add Finance Record</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={18} /></button>
              </div>
              <form onSubmit={save} className="p-6 space-y-4">
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Student</label>
                  <select required value={form.student} onChange={e=>setForm({...form,student:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none">
                    <option value="">-- Select Student --</option>
                    {students.map(s=><option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                  </select></div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description</label><input required value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Spring 2026 Tuition" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Type</label>
                    <select value={form.record_type} onChange={e=>setForm({...form,record_type:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none">
                      {['Fee','Fine','Scholarship'].map(t=><option key={t} value={t}>{t}</option>)}
                    </select></div>
                  <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Amount (₹)</label><input type="number" step="0.01" required value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="5000" /></div>
                </div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Due Date</label><input type="date" required value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" /></div>
                <div className="flex items-center gap-3"><input type="checkbox" id="paid" checked={form.paid} onChange={e=>setForm({...form,paid:e.target.checked})} className="w-4 h-4 accent-teal-600" /><label htmlFor="paid" className="text-sm font-bold text-slate-700 dark:text-slate-300">Mark as Paid</label></div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-bold">Save Record</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Finance;
