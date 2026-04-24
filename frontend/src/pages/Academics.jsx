import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Printer, X, Loader2, FileText, Award, BookOpen, Plus, Save, Edit2, Trash2, GraduationCap, TrendingUp, TrendingDown, ChevronDown, Filter, ChevronRight, Download } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api/' });
api.interceptors.request.use(c => { const t = localStorage.getItem('access_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

const Academics = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [showFilters, setShowFilters] = useState(false);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  
  // For the chart:
  const [globalChartSemester, setGlobalChartSemester] = useState('All');
  const [globalChartBranch, setGlobalChartBranch] = useState('All');
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [marks, setMarks] = useState([]);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [systemCourses, setSystemCourses] = useState([]);
  const [allMarks, setAllMarks] = useState([]);
  
  const [selectedSemester, setSelectedSemester] = useState(null);

  const isAdmin = localStorage.getItem('user_role') === 'admin';

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    course_code: '', subject_name: '', cie_marks: 0, see_marks: 0, credits_registered: 4, semester: 1
  });

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddData, setQuickAddData] = useState({ student_id: '', first_name: '', last_name: '', course: '' });

  const handleQuickAddStudent = async (e) => {
    e.preventDefault();
    if(!quickAddData.student_id || !quickAddData.first_name || !quickAddData.course) return alert('Fill mandatory fields');
    
    const payload = {
        ...quickAddData,
        email: `${quickAddData.student_id.toLowerCase()}@system.local`,
        phone: '0000000000',
        enrollment_date: new Date().toISOString().split('T')[0]
    };
    
    try {
        const res = await api.post('students/', payload);
        setShowQuickAdd(false);
        setQuickAddData({ student_id: '', first_name: '', last_name: '', course: '' });
        await fetchStudents();
        loadStudentDetails(res.data);
    } catch(err) {
        alert('Error creating student. ID might already exist.');
    }
  };

  useEffect(() => {
    api.get('courses/?all=true').then(res => setSystemCourses(res.data.results || res.data)).catch(()=>{});
    api.get('marks/?all=true').then(res => setAllMarks(res.data.results || res.data)).catch(()=>{});
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [search, filterCourse, filterSemester]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get(`students/?search=${search}` + (filterCourse ? `&course=${filterCourse}` : '') + (filterSemester ? `&semester=${filterSemester}` : ''));
      setStudents(res.data.results || res.data);
    } catch (err) {}
    setLoading(false);
  };

  const loadStudentDetails = async (student) => {
    setSelectedStudent(student);
    setLoadingMarks(true);
    setShowAddForm(false);
    setEditingId(null);
    try {
      const res = await api.get(`marks/?student_id=${student.id}&all=true`);
      const mData = res.data.results || res.data;
      setMarks(mData);
      
      const sems = Array.from(new Set(mData.map(m => m.semester))).sort((a,b) => b-a);
      if (sems.length > 0) {
        setSelectedSemester(sems[0]); // default to latest
      } else {
        setSelectedSemester(1);
      }
    } catch (err) {}
    setLoadingMarks(false);
  };

  const handlePrint = () => window.print();

  const handleSaveMark = async () => {
    if (!formData.course_code || !formData.subject_name) return alert('Course Code and Name required.');
    try {
      const payload = { ...formData, student: selectedStudent.id };
      if (editingId) {
        await api.put(`marks/${editingId}/`, payload);
      } else {
        await api.post(`marks/`, payload);
      }
      setEditingId(null);
      setShowAddForm(false);
      
      // Auto switch to that semester
      setSelectedSemester(Number(formData.semester));
      
      setFormData({ course_code: '', subject_name: '', cie_marks: 0, see_marks: 0, credits_registered: 4, semester: formData.semester });
      
      await loadStudentDetails(selectedStudent);
      await fetchStudents(); 
      const sRes = await api.get(`students/${selectedStudent.id}/`);
      setSelectedStudent(sRes.data);
    } catch (err) { alert('Error saving mark. Please check inputs.'); }
  };

  const handleDeleteMark = async (id) => {
    if (!window.confirm('Are you sure you want to delete this mark?')) return;
    try {
      await api.delete(`marks/${id}/`);
      await loadStudentDetails(selectedStudent);
      const sRes = await api.get(`students/${selectedStudent.id}/`);
      setSelectedStudent(sRes.data);
      fetchStudents();
    } catch (err) {}
  };

  const handleDownloadGlobalExcel = async () => {
    if(!window.confirm('Do you want to absolutely download the complete database of all students including all semester marks, grades, and branches?')) return;
    const wb = XLSX.utils.book_new();
    const overviewData = students.map(s => ({ ID: s.student_id, Name: `${s.first_name} ${s.last_name}`, Branch: s.course, Semester: s.current_semester, Attendance: `${s.attendance_percentage}%` }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overviewData), 'Overview');
    try {
      const res = await api.get('marks/?all=true');
      const allMarks = res.data.results || res.data;
      const detailedMarks = students.map(s => {
         let row = { ID: s.student_id, Name: `${s.first_name} ${s.last_name}`, Branch: s.course, 'Current Semester': s.current_semester };
         const sMarks = allMarks.filter(m => m.student_id === s.id);
         sMarks.forEach(m => { row[`Sem ${m.semester} - ${m.subject_name}`] = `CIE:${m.cie_marks} | SEE:${m.see_marks} | ${m.grade}`; });
         return row;
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailedMarks), 'All Grades');
      XLSX.writeFile(wb, 'all_students_grades.xlsx');
    } catch(err) { alert('Failed processing data download.'); }
  };

  const handleDownloadStudentExcel = async (student) => {
    if(!window.confirm(`Generate entire isolated grade history report card for ${student.first_name}?`)) return;
    const wb = XLSX.utils.book_new();
    const overview = [{ ID: student.student_id, Name: `${student.first_name} ${student.last_name}`, Course: student.course, 'Current Semester': student.current_semester, Email: student.email }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overview), 'Profile');
    try {
      const res = await api.get(`marks/?student_id=${student.id}&all=true`);
      const marks = res.data.results || res.data;
      const mapped = marks.map(m => ({
        Semester: m.semester, Subject: m.subject_name, Credits: m.credits_registered, CIE: m.cie_marks, SEE: m.see_marks, 
        Total: parseFloat(m.cie_marks) + parseFloat(m.see_marks), Grade: m.grade, Points: m.grade_points
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapped), 'Report Card');
      XLSX.writeFile(wb, `${student.first_name.replace(/ /g, '_')}_grades.xlsx`.toLowerCase());
    } catch(err) { alert('Error fetching marks.'); }
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setShowAddForm(false);
    setFormData({
      course_code: m.course_code, subject_name: m.subject_name,
      cie_marks: m.cie_marks, see_marks: m.see_marks, 
      credits_registered: m.credits_registered, semester: m.semester || 1
    });
  };

  const subjectPerfData = useMemo(() => {
    const stats = {};
    let marksToUse = allMarks;
    
    if (globalChartSemester !== 'All') {
        marksToUse = marksToUse.filter(m => m.semester === Number(globalChartSemester));
    }
    if (globalChartBranch !== 'All') {
        marksToUse = marksToUse.filter(m => m.student_branch === globalChartBranch);
    }
    
    marksToUse.forEach(m => {
      if (!stats[m.course_code]) stats[m.course_code] = { name: m.subject_name.substring(0, 15)+'...', totalCIE: 0, totalSEE: 0, count: 0 };
      stats[m.course_code].totalCIE += parseFloat(m.cie_marks);
      stats[m.course_code].totalSEE += parseFloat(m.see_marks);
      stats[m.course_code].count += 1;
    });
    return Object.keys(stats).map(k => ({
      name: stats[k].name, CIE: Math.round(stats[k].totalCIE / stats[k].count), SEE: Math.round(stats[k].totalSEE / stats[k].count),
    }));
  }, [allMarks, globalChartSemester, globalChartBranch]);
  
  // Derivations for selected student
  const availableSemesters = useMemo(() => {
      return Array.from(new Set(marks.map(m => m.semester))).sort((a,b) => a-b);
  }, [marks]);
  
  const filteredMarks = useMemo(() => {
      return marks.filter(m => m.semester === selectedSemester);
  }, [marks, selectedSemester]);
  
  const currentSgpaObj = useMemo(() => {
      const mapping = {'O':10, 'A+':9, 'A':8, 'B+':7, 'B':6, 'C':5, 'P':4, 'F':0, 'PP':0};
      let totalPts = 0; let totalCrd = 0;
      filteredMarks.forEach(m => {
          if (m.credits_registered > 0) {
              totalPts += (m.credits_registered * (mapping[m.grade] || 0));
              totalCrd += m.credits_registered;
          }
      });
      return { val: totalCrd > 0 ? (totalPts / totalCrd).toFixed(2) : '0.00', crd: totalCrd };
  }, [filteredMarks]);

  const progressData = useMemo(() => {
     return availableSemesters.map((sem, i) => {
         let sMarks = marks.filter(m => m.semester === sem);
         let totalObtained = sMarks.reduce((sum, m) => sum + parseFloat(m.cie_marks) + parseFloat(m.see_marks), 0);
         let totalMax = sMarks.length * 100;
         let pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
         return { name: `Sem ${sem}`, Score: Math.round(pct), sem: sem };
     });
  }, [availableSemesters, marks]);
  
  const currentImprovement = useMemo(() => {
     if (progressData.length < 2) return null;
     const current = progressData.find(d => d.sem === selectedSemester);
     const curIdx = progressData.findIndex(d => d.sem === selectedSemester);
     if (!current || curIdx === 0) return null;
     
     const prev = progressData[curIdx - 1];
     const diff = current.Score - prev.Score;
     return diff;
  }, [progressData, selectedSemester]);

  const subjectBarData = useMemo(() => {
      return filteredMarks.map(m => {
          const total = parseFloat(m.cie_marks) + parseFloat(m.see_marks);
          return { name: m.subject_name.length > 15 ? m.subject_name.substring(0,15)+'..' : m.subject_name, Obtained: Math.round(total), 'Total Marks': 100 };
      });
  }, [filteredMarks]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors flex items-center gap-2"><GraduationCap className="text-teal-500" size={24}/> Grade Reports</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 transition-colors">Select a student to view their detailed provisional results.</p>
        </div>
        <div className="flex relative w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none shadow-sm transition-all" />
          </div>
          
          <div className="flex items-center gap-2 relative">
             {isAdmin && (
               <button onClick={() => setShowQuickAdd(!showQuickAdd)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-sm flex items-center gap-2 h-full transition-colors">
                 <Plus className="w-4 h-4" /> Add Student
               </button>
             )}
             <AnimatePresence>
               {showQuickAdd && (
                 <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="absolute right-0 md:right-1/2 md:translate-x-[60%] top-14 w-80 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-slate-800 dark:text-slate-100">Quick Add Student</h3>
                       <button onClick={()=>setShowQuickAdd(false)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
                    </div>
                     <form onSubmit={handleQuickAddStudent} className="flex flex-col gap-4">
                       <div>
                         <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1.5 tracking-wider">Student ID *</label>
                         <input type="text" value={quickAddData.student_id} onChange={e => setQuickAddData({...quickAddData, student_id: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-sm focus:bg-white" required />
                       </div>
                       <div className="flex gap-3">
                           <div className="flex-1">
                             <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1.5 tracking-wider">First Name *</label>
                             <input type="text" value={quickAddData.first_name} onChange={e => setQuickAddData({...quickAddData, first_name: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-sm focus:bg-white" required />
                           </div>
                           <div className="flex-1">
                             <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1.5 tracking-wider">Last Name</label>
                             <input type="text" value={quickAddData.last_name} onChange={e => setQuickAddData({...quickAddData, last_name: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-sm focus:bg-white" />
                           </div>
                       </div>
                       <div>
                         <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1.5 tracking-wider">Course / Branch *</label>
                         <select value={quickAddData.course} onChange={e => { setQuickAddData({...quickAddData, course: e.target.value}); }} className="w-full bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-sm cursor-pointer hover:bg-slate-100" required>
                           <option value="">Select Branch</option>
                           {['Mechanical Engineering', 'Civil Engineering', 'Computer Science Engineering', 'Information Technology', 'Electronics & Comm.'].map(b => <option key={b} value={b}>{b}</option>)}
                         </select>
                       </div>
                       <div className="pt-2">
                         <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3 text-sm font-bold shadow-md shadow-teal-500/20 hover:shadow-teal-500/40 transition-all flex items-center justify-center gap-2">
                           Create & Open Report <ChevronRight size={16} />
                         </button>
                       </div>
                    </form>
                 </motion.div>
               )}
             </AnimatePresence>
             <button onClick={handleDownloadGlobalExcel} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 px-4 py-2.5 rounded-xl font-bold shadow-sm flex items-center gap-2 h-full transition-colors">
               <Download className="w-4 h-4" /> Export
             </button>
             <button onClick={() => setShowFilters(!showFilters)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-teal-600 px-4 py-2.5 rounded-xl font-bold shadow-sm flex items-center gap-2 h-full transition-colors">
               <Filter className="w-4 h-4" /> Filter
             </button>
             <AnimatePresence>
               {showFilters && (
                 <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="absolute right-0 top-12 w-64 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">By Course / Branch</label>
                    <select value={filterCourse} onChange={e => { setFilterCourse(e.target.value); }} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 mb-4">
                      <option value="">All Courses</option>
                      {['Mechanical Engineering', 'Civil Engineering', 'Computer Science Engineering', 'Information Technology', 'Electronics & Comm.'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>

                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">By Semester</label>
                    <select value={filterSemester} onChange={e => { setFilterSemester(e.target.value); }} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 mb-4">
                      <option value="">All Semesters</option>
                      {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                    
                    <button onClick={() => setShowFilters(false)} className="w-full bg-teal-600 text-white rounded-lg py-2 text-sm font-bold mt-2">Apply Filters</button>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>
      </div>

      {isAdmin && subjectPerfData.length > 0 && (
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 border border-slate-100 dark:border-slate-700">
           <div className="flex justify-between items-center mb-6">
               <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">College-Wide Subject Performance (Average Marks)</h3>
               <div className="flex gap-2">
                   <select 
                       value={globalChartBranch} 
                       onChange={(e) => setGlobalChartBranch(e.target.value)}
                       className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-bold py-1.5 px-3 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                   >
                       <option value="All">All Branches</option>
                       {Array.from(new Set(allMarks.map(m => m.student_branch))).filter(Boolean).map(b => (
                           <option key={b} value={b}>{b}</option>
                       ))}
                   </select>

                   <select 
                       value={globalChartSemester} 
                       onChange={(e) => setGlobalChartSemester(e.target.value)}
                       className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-bold py-1.5 px-3 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                   >
                       <option value="All">All Semesters</option>
                       {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                   </select>
               </div>
           </div>
           <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={subjectPerfData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} dx={-10} />
                 <RechartsTooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: '#ffffff', color: '#1e293b', fontWeight: 'bold' }} />
                 <Legend verticalAlign="top" height={36} iconType="circle" />
                 <Bar dataKey="CIE" stackId="a" fill="#0d9488" radius={[0, 0, 4, 4]} />
                 <Bar dataKey="SEE" stackId="a" fill="#059669" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      )}

      <div className="glass rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="py-5 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Student Name</th>
                <th className="py-5 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">ID</th>
                <th className="py-5 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Course / Branch</th>
                <th className="py-5 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Sem</th>
                <th className="py-5 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Provisional Result</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-slate-100 dark:border-slate-800/60">
                    <td className="py-5 px-6"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
                    <td className="py-5 px-6"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
                    <td className="py-5 px-6"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-28"></div></td>
                    <td className="py-5 px-6"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-20 ml-auto"></div></td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr><td colSpan="4" className="py-16 text-center text-slate-500 font-medium text-lg">No students found.</td></tr>
              ) : (
                students.map((student, idx) => (
                  <motion.tr initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} key={student.id} className="border-b border-slate-100/60 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-teal-200 dark:shadow-none">
                         {student.first_name?.[0]}{student.last_name?.[0]}
                      </div>
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400">{student.student_id}</td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-semibold transition-colors">{student.course}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1 rounded-md text-xs border border-teal-100 dark:border-teal-800/50">Sem {student.current_semester || 1}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 ml-auto">
                        <button onClick={() => handleDownloadStudentExcel(student)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 rounded-lg transition-colors shadow-sm" title="Export Excel Card">
                           <Download size={16} />
                        </button>
                        <button onClick={() => loadStudentDetails(student)} className="bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/40 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-400 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm">
                          <FileText size={16} /> View Report
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL SCREEN EXPERT MODAL */}
      {createPortal(
        <AnimatePresence>
          {selectedStudent && (
            <div className="fixed inset-0 flex items-center justify-center print:bg-white bg-slate-900/90 backdrop-blur-md overflow-hidden" style={{ zIndex: 99999 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-50 dark:bg-slate-900 w-full h-full sm:w-[95%] sm:h-[95vh] sm:rounded-[2rem] shadow-2xl relative flex flex-col overflow-hidden print:my-0 print:shadow-none print:w-full print:h-auto print:max-w-none print:rounded-none"
            >
              <button 
                onClick={() => setSelectedStudent(null)} 
                className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all print:hidden"
              >
                <X size={20} />
              </button>

              {/* HEADER */}
              <div className="relative bg-slate-900 p-6 sm:p-10 shrink-0 overflow-hidden print:bg-slate-100 print:text-black print:p-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl mix-blend-screen"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl mix-blend-screen"></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left text-white print:text-black">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white/20 print:border-slate-300 shadow-xl overflow-hidden bg-gradient-to-tr from-teal-400 to-blue-500 flex items-center justify-center text-3xl font-black">
                    {selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}
                  </div>
                  <div className="flex-1 mt-1">
                     <div className="flex flex-col md:flex-row justify-between items-center md:items-start w-full">
                        <div>
                            <h2 className="text-3xl font-extrabold tracking-tight mb-2">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 text-blue-100 print:text-slate-600 font-medium text-sm">
                            <span className="flex items-center gap-1.5 bg-white/10 print:bg-transparent px-3 py-1 rounded-lg backdrop-blur-sm"><Award size={16}/> {selectedStudent.student_id}</span>
                            <span className="flex items-center gap-1.5 bg-white/10 print:bg-transparent px-3 py-1 rounded-lg backdrop-blur-sm"><BookOpen size={16}/> {selectedStudent.course}</span>
                            </div>
                        </div>
                        {/* Overall CGPA Badge */}
                        <div className="mt-4 md:mt-0 right-0 py-2 px-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center flex flex-col items-center">
                            <p className="text-xs font-bold text-teal-200 uppercase tracking-widest mb-1">Overall CGPA</p>
                            <p className="text-4xl font-black text-white">{selectedStudent.cgpa || '0.00'}</p>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              {/* BODY */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 hide-scrollbar bg-slate-50 dark:bg-slate-900 print:bg-white print:p-6 print:overflow-visible flex flex-col">
                 <div className="flex flex-col xl:flex-row gap-8 mb-8 flex-1">
                     
                     {/* Left Panel: Analytics & Selection */}
                     <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0 print:hidden">
                        
                        {/* Semester Selection */}
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">View Report</h3>
                            <div className="relative">
                                <select 
                                    className="w-full appearance-none bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-bold py-3 pl-4 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition-shadow"
                                    value={selectedSemester || ''}
                                    onChange={(e) => setSelectedSemester(Number(e.target.value))}
                                >
                                    {availableSemesters.length === 0 && <option value="">No Semesters Available</option>}
                                    {availableSemesters.map(sem => (
                                        <option key={sem} value={sem}>Semester {sem}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                            </div>
                        </div>

                        {/* Overall Analytics Progress Graph */}
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm grow flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Progress Journey</h3>
                                {currentImprovement !== null && (
                                    <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${currentImprovement >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'}`}>
                                        {currentImprovement >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                                        {currentImprovement >= 0 ? '+' : ''}{currentImprovement}%
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-h-[160px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={progressData} margin={{top: 5, right: 10, left: -20, bottom: 0}}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dx={-10} domain={[0, 100]} />
                                        <RechartsTooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: '#ffffff', color: '#1e293b', fontWeight: 'bold' }} />
                                        <Line type="monotone" dataKey="Score" stroke="#0d9488" strokeWidth={3} dot={{r: 4, fill: '#0d9488'}} activeDot={{r: 6}} animationDuration={1500} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                     </div>

                     {/* Right Panel: Marks & Forms */}
                     <div className="flex-1 flex flex-col">
                        
                        {/* Upper Stats bar */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm text-center">
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Sem SGPA</p>
                                <p className="text-2xl font-black text-teal-600 dark:text-teal-400">{currentSgpaObj.val}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm text-center">
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Sem Credits</p>
                                <p className="text-2xl font-black text-slate-700 dark:text-slate-200">{currentSgpaObj.crd}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm md:col-span-2 hidden md:block print:hidden">
                                <ResponsiveContainer width="100%" height={40}>
                                    <BarChart data={subjectBarData} margin={{top: 0, right: 0, left: -20, bottom: -10}}>
                                        <XAxis dataKey="name" hide />
                                        <YAxis hide domain={[0, 100]} />
                                        <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', background: '#334155', color: '#fff', fontSize: '12px' }} />
                                        <Bar dataKey="Obtained" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-[2px] border-slate-200 dark:border-slate-700 pb-3 mb-4 gap-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Semester {selectedSemester} Marks</h3>
                            </div>
                            <div className="flex gap-3 print:hidden">
                                {isAdmin && !showAddForm && !editingId && (
                                <button onClick={() => { setShowAddForm(true); setFormData({ course_code: '', subject_name: '', cie_marks: 0, see_marks: 0, credits_registered: 4, semester: selectedSemester || 1 }); }} className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 hover:bg-slate-900 transition-colors shadow-md">
                                    <Plus size={16}/> Add Grade
                                </button>
                                )}
                                <button onClick={handlePrint} className="bg-teal-600 text-white px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 hover:bg-teal-700 transition-colors shadow-md shadow-teal-500/30">
                                <Printer size={16}/> Print
                                </button>
                            </div>
                        </div>

                        {/* Admin Add / Edit Form */}
                        <AnimatePresence>
                        {(showAddForm || editingId) && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden print:hidden">
                            <div className="bg-teal-50 dark:bg-teal-900/20 p-5 rounded-2xl border border-teal-200 dark:border-teal-900/50">
                                <h4 className="font-bold text-teal-800 dark:text-teal-400 mb-4">{editingId ? 'Edit Grade Record' : 'Add New Grade Record'}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-teal-700/70 dark:text-teal-400/70 mb-1 block">Select Course</label>
                                    <select 
                                        value={formData.course_code} 
                                        onChange={e => {
                                            const code = e.target.value;
                                            const course = systemCourses.find(c => c.code === code);
                                            if (course) { setFormData({...formData, course_code: course.code, subject_name: course.name}); } 
                                            else { setFormData({...formData, course_code: code, subject_name: code}); }
                                        }} 
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500"
                                    >
                                    <option value="">-- Choose --</option>
                                    {systemCourses.map(c => (<option key={c.id} value={c.code}>{c.code} - {c.name}</option>))}
                                    {systemCourses.length === 0 && (<><option value="CS101">CS101 - INTRO</option><option value="MA101">MA101 - MATH</option></>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-teal-700/70 dark:text-teal-400/70 mb-1 block">CIE Marks</label>
                                    <input type="number" step="0.1" value={formData.cie_marks} onChange={e => setFormData({...formData, cie_marks: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 rounded-xl text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-teal-700/70 dark:text-teal-400/70 mb-1 block">SEE Marks</label>
                                    <input type="number" step="0.1" value={formData.see_marks} onChange={e => setFormData({...formData, see_marks: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 rounded-xl text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-teal-700/70 dark:text-teal-400/70 mb-1 block">Credits</label>
                                    <input type="number" value={formData.credits_registered} onChange={e => setFormData({...formData, credits_registered: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 rounded-xl text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-teal-700/70 dark:text-teal-400/70 mb-1 block">Sem</label>
                                    <input type="number" value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 rounded-xl text-sm font-bold text-teal-700 dark:text-teal-300" />
                                </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                <button onClick={() => { setShowAddForm(false); setEditingId(null); }} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancel</button>
                                <button onClick={handleSaveMark} className="px-4 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors flex items-center gap-2 shadow-md">
                                    <Save size={16}/> Save Grade
                                </button>
                                </div>
                            </div>
                            </motion.div>
                        )}
                        </AnimatePresence>

                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto shadow-sm print:shadow-none print:border-none print:bg-transparent">
                            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                                <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 print:bg-slate-100 print:border-slate-300">
                                    <th className="py-4 px-4 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">Code</th>
                                    <th className="py-4 px-4 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">Course Name</th>
                                    <th className="py-4 px-3 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider text-center">CIE</th>
                                    <th className="py-4 px-3 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider text-center">SEE</th>
                                    <th className="py-4 px-3 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider text-center">Cr</th>
                                    <th className="py-4 px-4 text-slate-800 dark:text-slate-200 font-black text-xs uppercase tracking-wider text-center">Tot</th>
                                    <th className="py-4 px-4 text-teal-600 dark:text-teal-400 font-black text-xs uppercase tracking-wider text-center">Gr</th>
                                    {isAdmin && <th className="py-4 px-4 font-bold text-xs text-center print:hidden text-slate-400 uppercase">Act</th>}
                                </tr>
                                </thead>
                                <tbody>
                                {loadingMarks ? (
                                    <tr><td colSpan={isAdmin ? 8 : 7} className="py-16 text-center text-slate-500"><Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-500" /></td></tr>
                                ) : filteredMarks.length === 0 ? (
                                    <tr><td colSpan={isAdmin ? 8 : 7} className="py-16 text-center text-slate-500 text-lg font-medium">No grades registered for Sem {selectedSemester}.</td></tr>
                                ) : (
                                    filteredMarks.map((m) => (
                                    <tr key={m.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors print:border-slate-200">
                                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-bold">{m.course_code}</td>
                                        <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-bold">{m.subject_name}</td>
                                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-center font-medium">{parseFloat(m.cie_marks).toFixed(1)}</td>
                                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-center font-medium">{parseFloat(m.see_marks).toFixed(1)}</td>
                                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-center font-medium">{parseFloat(m.credits_registered).toFixed(0)}</td>
                                        <td className="py-3 px-4 text-slate-800 dark:text-slate-100 font-black text-center text-base">{Math.round(m.total_marks)}</td>
                                        <td className="py-3 px-4 text-slate-800 dark:text-slate-100 font-black text-center text-base">{m.grade}</td>
                                        {isAdmin && (
                                        <td className="py-3 px-4 text-center print:hidden flex justify-center gap-1.5">
                                            <button onClick={() => startEdit(m)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"><Edit2 size={13}/></button>
                                            <button onClick={() => handleDeleteMark(m.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"><Trash2 size={13}/></button>
                                        </td>
                                        )}
                                    </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                     </div>
                 </div>
              </div>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default Academics;
