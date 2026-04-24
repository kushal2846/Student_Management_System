import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, Upload, CalendarCheck, Loader2, Plus, X, Eye, Download, CheckCircle, XCircle, ChevronLeft, ChevronRight, Filter, History, FileText } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api/' });
api.interceptors.request.use(c => { const t = localStorage.getItem('access_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [currentStudent, setCurrentStudent] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [showRecycleBin, setShowRecycleBin] = useState(false);

  // Filters & Bulk actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search') || '';
  
  const userRole = localStorage.getItem('user_role');
  const isStaff = userRole === 'admin';

  const [formData, setFormData] = useState({ student_id: '', first_name: '', last_name: '', email: '', phone: '', course: '', enrollment_date: '', attendance_date: new Date().toISOString().split('T')[0] });

  const fetchStudents = async (url = `students/?search=${searchQuery}`) => {
    setLoading(true);
    try {
      const delParam = showRecycleBin ? '&is_deleted=true' : '&is_deleted=false';
      const [res, cRes] = await Promise.all([
        api.get(url + (filterCourse ? `&course=${filterCourse}` : '') + (filterSemester ? `&semester=${filterSemester}` : '') + delParam),
        api.get('courses/?all=true')
      ]);
      setCourses(cRes.data.results || cRes.data);
      if (res.data.results) { setStudents(res.data.results); setNextPage(res.data.next); setPrevPage(res.data.previous); } 
      else { setStudents(res.data); setNextPage(null); setPrevPage(null); }
    } catch (err) {} finally { setTimeout(() => setLoading(false), 300); }
  };

  useEffect(() => { fetchStudents(); }, [searchQuery, filterCourse, filterSemester, showRecycleBin]);

  const handleOpenModal = async (type, student = null) => {
    setModalType(type); setCurrentStudent(student);
    if (student && (type === 'edit' || type === 'attendance')) setFormData({ ...student, attendance_date: new Date().toISOString().split('T')[0] });
    else setFormData({ student_id: '', first_name: '', last_name: '', email: '', phone: '', course: courses[0]?.name || '', enrollment_date: '', attendance_date: new Date().toISOString().split('T')[0] });
    
    if (type === 'history') {
      try { const r = await api.get(`attendance/?search=${student.student_id}&all=true`); setAttendanceHistory(r.data.results || r.data); } catch (e) {}
    }
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setCurrentStudent(null); setAttendanceHistory([]); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'add') await api.post('students/', formData);
      else if (modalType === 'edit') await api.put(`students/${currentStudent.id}/`, formData);
      fetchStudents(); closeModal();
    } catch (err) { alert('Error saving data.'); }
  };
  
  const handleAttendance = async (isPresent) => {
    try { await api.post('attendance/', { student: currentStudent.id, date: formData.attendance_date, is_present: isPresent }); fetchStudents(); closeModal(); } 
    catch (err) { alert('Already marked or error.'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`students/${currentStudent.id}/`); fetchStudents(); closeModal(); } catch (err) {}
  };

  const handleRestore = async (id) => {
    try { await api.post(`students/${id}/restore/`); fetchStudents(); } catch(e) { alert('Error restoring'); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} students?`)) return;
    try { await api.post('students/bulk_delete/', { ids: selectedIds }); setSelectedIds([]); fetchStudents(); } catch(e) { alert('Error bulk deleting'); }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault(); const data = new FormData(); data.append('document', e.target.document.files[0]);
    try { await api.patch(`students/${currentStudent.id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } }); fetchStudents(); closeModal(); } catch (err) {}
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
      XLSX.writeFile(wb, 'all_students.xlsx');
    } catch(err) { alert('Failed processing data download.'); }
  };

  const handleDownloadStudentExcel = async (student) => {
    if(!window.confirm(`Generate entire isolated grade history report card for ${student.first_name}?`)) return;
    const wb = XLSX.utils.book_new();
    const overview = [{ ID: student.student_id, Name: `${student.first_name} ${student.last_name}`, Course: student.course, 'Current Semester': student.current_semester, Email: student.email }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overview), 'Profile Profile');
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

  const toggleSelectAll = () => {
    if (selectedIds.length === students.length) setSelectedIds([]);
    else setSelectedIds(students.map(s => s.id));
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            {showRecycleBin ? 'Recycle Bin' : 'Student Directory'}
            {isStaff && selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} className="text-[12px] bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-3 py-1 rounded-full hover:bg-red-200 transition-colors">
                Delete {selectedIds.length} Selected
              </button>
            )}
          </h2>
          {searchQuery && <p className="text-slate-500 text-sm mt-1">Showing results for: "{searchQuery}"</p>}
        </div>
        <div className="flex gap-3">
          <motion.div className="relative">
             <button onClick={() => setShowFilters(!showFilters)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-teal-600 px-4 py-2.5 rounded-xl font-bold shadow-sm flex items-center gap-2">
               <Filter className="w-4 h-4" /> Filter
             </button>
             <AnimatePresence>
               {showFilters && (
                 <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="absolute right-0 top-12 w-64 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">By Course / Branch</label>
                    <select value={filterCourse} onChange={e => { setFilterCourse(e.target.value); }} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 mb-4">
                      <option value="">All Courses</option>
                      {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
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
          </motion.div>
          <motion.button onClick={handleDownloadGlobalExcel} whileHover={{ scale: 1.02 }} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 px-4 py-2.5 rounded-xl font-bold shadow-sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </motion.button>
          {isStaff && (
            <>
              <motion.button onClick={() => setShowRecycleBin(!showRecycleBin)} whileHover={{ scale: 1.02 }} className={`border px-4 py-2.5 rounded-xl font-bold shadow-sm flex items-center gap-2 ${showRecycleBin ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-amber-600'}`}>
                <History className="w-4 h-4" /> {showRecycleBin ? 'Back to Active' : 'Recycle Bin'}
              </motion.button>
              {!showRecycleBin && (
                <motion.button onClick={() => handleOpenModal('add')} whileHover={{ scale: 1.02 }} className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2">
                  <Plus className="w-5 h-5" /> Add Student
                </motion.button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="glass rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                {isStaff && <th className="py-5 pl-6 pr-2"><input type="checkbox" checked={students.length > 0 && selectedIds.length === students.length} onChange={toggleSelectAll} className="w-4 h-4 rounded text-teal-600" /></th>}
                <th className={`py-5 ${isStaff ? 'px-2' : 'px-6'} text-xs font-bold text-slate-500 uppercase`}>ID</th>
                <th className="py-5 px-6 text-xs font-bold text-slate-500 uppercase">Name</th>
                <th className="py-5 px-6 text-xs font-bold text-slate-500 uppercase">Course</th>
                <th className="py-5 px-6 text-xs font-bold text-slate-500 uppercase text-center">Sem</th>
                <th className="py-5 px-6 text-xs font-bold text-slate-500 uppercase">Attendance</th>
                <th className="py-5 px-6 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isStaff ? 6 : 5} className="py-16 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={isStaff ? 6 : 5} className="py-16 text-center text-slate-500">No students found.</td></tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="border-b border-slate-100/60 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    {isStaff && <td className="py-4 pl-6 pr-2"><input type="checkbox" checked={selectedIds.includes(student.id)} onChange={(e) => { e.target.checked ? setSelectedIds([...selectedIds, student.id]) : setSelectedIds(selectedIds.filter(id => id !== student.id)) }} className="w-4 h-4 rounded text-teal-600" /></td>}
                    <td className={`py-4 ${isStaff ? 'px-2' : 'px-6'} font-bold text-slate-700 dark:text-slate-300`}>{student.student_id}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4 cursor-pointer group" onClick={() => handleOpenModal('profile', student)}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-100 to-teal-100 dark:from-blue-900/40 dark:to-teal-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                          {student.first_name?.[0]}{student.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-500 transition-colors">{student.first_name} {student.last_name}</p>
                          <p className="text-xs font-medium text-slate-500">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6"><span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-bold uppercase tracking-wider">{student.course}</span></td>
                    <td className="py-4 px-6 text-center"><span className="font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1 rounded-md text-xs border border-teal-100 dark:border-teal-800/50">Sem {student.current_semester || 1}</span></td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div className={`h-full rounded-full ${parseFloat(student.attendance_percentage) > 75 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${student.attendance_percentage}%` }}></div>
                        </div>
                        <span className="text-sm font-bold w-12">{student.attendance_percentage}%</span>
                        <button onClick={() => handleOpenModal('history', student)} className="text-slate-400 hover:text-teal-500 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"><History size={14}/></button>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleDownloadStudentExcel(student)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 rounded-lg transition-colors" title="Export Excel Card"><Download size={16} /></button>
                        <button onClick={() => handleOpenModal('profile', student)} className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50/50 hover:bg-blue-50 dark:bg-slate-800/50 dark:hover:bg-blue-900/30 rounded-lg"><Eye size={16} /></button>
                        {isStaff && showRecycleBin ? (
                          <button onClick={() => handleRestore(student.id)} className="px-3 py-1.5 text-xs text-amber-600 font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm border border-amber-200/50 dark:border-amber-800/50">
                            Restore
                          </button>
                        ) : isStaff && (
                          <>
                            {student.document ? (
                              <>
                                <a href={student.document} target="_blank" rel="noopener noreferrer" title="View Document" className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100"><FileText size={16} /></a>
                                <button onClick={() => handleOpenModal('upload', student)} title="Replace Document" className="p-2 text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg hover:bg-cyan-100"><Upload size={16} /></button>
                              </>
                            ) : (
                              <button onClick={() => handleOpenModal('upload', student)} title="Upload Document" className="p-2 text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg hover:bg-cyan-100"><Upload size={16} /></button>
                            )}
                            <button onClick={() => handleOpenModal('edit', student)} className="p-2 text-teal-600 bg-teal-50 dark:bg-teal-900/30 rounded-lg hover:bg-teal-100"><Edit2 size={16} /></button>
                            <button onClick={() => handleOpenModal('attendance', student)} className="p-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg hover:bg-emerald-100"><CalendarCheck size={16} /></button>
                            <button onClick={() => handleOpenModal('delete', student)} className="p-2 text-red-600 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100"><Trash2 size={16} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          <div className="border-t border-slate-100 dark:border-slate-800 p-4 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/30">
            <span className="text-sm text-slate-500 font-medium">Page controls</span>
            <div className="flex gap-2">
              <button disabled={!prevPage} onClick={() => fetchStudents(prevPage.split('8000/api/')[1])} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="w-5 h-5" /></button>
              <button disabled={!nextPage} onClick={() => fetchStudents(nextPage.split('8000/api/')[1])} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden">
              
              {/* Add / Edit Form Modal */}
              {(modalType === 'add' || modalType === 'edit') && (
                <>
                  <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{modalType === 'add' ? 'Add New Student' : 'Edit Student Details'}</h3>
                    <button onClick={closeModal} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"><X className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Student ID</label><input required value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})} className="w-full border p-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500 border-slate-200 dark:border-slate-700" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">First Name</label><input required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full border p-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 border-slate-200 dark:border-slate-700" /></div>
                      <div><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Last Name</label><input required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full border p-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 border-slate-200 dark:border-slate-700" /></div>
                    </div>
                    <div><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Email Address</label><input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border p-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 border-slate-200 dark:border-slate-700" /></div>
                    <div><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Phone</label><input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border p-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 border-slate-200 dark:border-slate-700" /></div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Enrolled Course / Branch</label>
                      <select value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} className="w-full border p-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                        {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Enrollment Date</label><input type="date" required value={formData.enrollment_date} onChange={e => setFormData({...formData, enrollment_date: e.target.value})} className="w-full border p-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 border-slate-200 dark:border-slate-700" /></div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button type="button" onClick={closeModal} className="px-5 py-2 text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
                      <button type="submit" className="px-5 py-2 text-white bg-teal-600 rounded-xl font-bold">Save Details</button>
                    </div>
                  </form>
                </>
              )}

              {/* View Profile Modal */}
              {modalType === 'profile' && currentStudent && (
                <>
                  <div className="relative h-24 bg-gradient-to-r from-blue-500 to-teal-600">
                    <button onClick={closeModal} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-xl bg-black/20"><X size={18}/></button>
                  </div>
                  <div className="px-6 pb-6 pt-0 text-center relative">
                    <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border-4 border-white dark:border-slate-900 mx-auto -mt-10 flex items-center justify-center text-2xl font-black text-teal-600 dark:text-teal-400">
                      {currentStudent.first_name[0]}{currentStudent.last_name[0]}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-3">{currentStudent.first_name} {currentStudent.last_name}</h2>
                    <p className="text-teal-500 font-bold mb-6">{currentStudent.student_id}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-left">
                      {currentStudent.document && (
                        <div className="col-span-2 bg-teal-50 dark:bg-teal-900/20 p-4 rounded-2xl flex justify-between items-center border border-teal-100 dark:border-teal-800/30">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-teal-400 mb-1">Student Record</p>
                            <p className="text-sm font-bold text-teal-700 dark:text-teal-300">Document Available</p>
                          </div>
                          <a href={currentStudent.document} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 shadow-md">
                            View Document
                          </a>
                        </div>
                      )}
                      
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Course / Branch</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{currentStudent.course}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Registered On</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{currentStudent.enrollment_date}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Email</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{currentStudent.email}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Phone</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{currentStudent.phone}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* View Attendance History Modal */}
              {modalType === 'history' && (
                <>
                  <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Attendance History</h3>
                    <button onClick={closeModal} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
                    {attendanceHistory.length === 0 ? <p className="text-center text-slate-500">No attendance records found.</p> :
                      attendanceHistory.map(record => (
                        <div key={record.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{record.date}</span>
                          {record.is_present ? 
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 rounded-lg"><CheckCircle size={14}/> Present</span> : 
                            <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/40 px-3 py-1 rounded-lg"><XCircle size={14}/> Absent</span>
                          }
                        </div>
                      ))
                    }
                  </div>
                </>
              )}

              {/* Mark Attendance Modal */}
              {modalType === 'attendance' && (
                <div className="p-6 text-center space-y-6">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 border-4 border-blue-50 dark:border-slate-800 rounded-full flex items-center justify-center mx-auto mb-4"><CalendarCheck className="w-8 h-8"/></div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Mark Attendance</h3>
                    <p className="text-slate-500">For {currentStudent?.first_name} {currentStudent?.last_name}</p>
                  </div>
                  <input type="date" value={formData.attendance_date} onChange={e => setFormData({...formData, attendance_date: e.target.value})} className="w-full border p-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 border-slate-200 dark:border-slate-700 text-center font-bold text-slate-700 dark:text-slate-200" />
                  <div className="flex gap-4">
                    <button onClick={() => handleAttendance(true)} className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"><CheckCircle className="w-5 h-5"/> Present</button>
                    <button onClick={() => handleAttendance(false)} className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"><XCircle className="w-5 h-5"/> Absent</button>
                  </div>
                  <button onClick={closeModal} className="text-sm font-bold text-slate-400 hover:text-slate-600 w-full pt-2">Cancel</button>
                </div>
              )}

              {/* Upload Document Modal */}
              {modalType === 'upload' && (
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 border-b pb-4 border-slate-100 dark:border-slate-800">Upload Document</h3>
                  <form onSubmit={handleFileUpload} className="space-y-4">
                    <p className="text-sm text-slate-500">Upload an ID or medical record for <b className="text-slate-700 dark:text-slate-300">{currentStudent?.first_name}</b>.</p>
                    <input type="file" name="document" required className="w-full border p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
                    <div className="flex gap-3 justify-end pt-2">
                         <button type="button" onClick={closeModal} className="px-5 py-2 text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
                         <button type="submit" className="px-5 py-2 text-white bg-teal-600 rounded-xl font-bold flex items-center gap-2"><Upload size={16}/> Upload</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Delete Modal */}
              {modalType === 'delete' && (
                <div className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 text-red-600 border-4 border-red-50 dark:border-slate-800 rounded-full flex items-center justify-center mx-auto mb-2"><Trash2 className="w-8 h-8"/></div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Move Student to Trash?</h3>
                  <p className="text-slate-500">This action will move {currentStudent?.first_name} to the Recycle Bin. You can restore them later.</p>
                  <div className="flex gap-3 pt-4">
                    <button onClick={closeModal} className="flex-1 px-5 py-3 text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold hover:bg-slate-200">Cancel</button>
                    <button onClick={handleDelete} className="flex-1 px-5 py-3 text-white bg-red-600 rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none">Trash Student</button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentList;
