import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, GraduationCap, Settings as SettingsIcon, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccountSettings = () => {
  const navigate = useNavigate();
  const [currentRole, setCurrentRole] = useState(localStorage.getItem('user_role') || 'admin');
  const [toast, setToast] = useState('');

  const handleRoleSwitch = (newRole) => {
    localStorage.setItem('user_role', newRole);
    setCurrentRole(newRole);
    
    // Set a toast message that will be picked up here or on Dashboard
    const msg = `Welcome to ${newRole === 'admin' ? 'Admin' : 'User'} page!`;
    localStorage.setItem('login_toast', msg);
    setToast(msg);

    // Auto-hide toast after 3s
    setTimeout(() => {
      setToast('');
      localStorage.removeItem('login_toast');
    }, 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10 relative">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-0 right-0 z-50 bg-emerald-100 border border-emerald-200 text-emerald-700 px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 font-bold">
            <CheckCircle2 size={20} className="text-emerald-600" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-tr from-teal-500 to-emerald-600 rounded-xl text-white shadow-lg shadow-teal-500/30">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Account Settings</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your profile and platform preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-bl-full blur-2xl"></div>
          
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Role Switcher</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Instantly switch your account view between Administrator capabilities (Full Access) and Student capabilities (Read-Only). 
          </p>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => handleRoleSwitch('admin')}
              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${currentRole === 'admin' ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-teal-300'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${currentRole === 'admin' ? 'bg-teal-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <Shield size={20} />
                </div>
                <div className="text-left">
                  <p className={`font-bold ${currentRole === 'admin' ? 'text-teal-700 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'}`}>Administrator</p>
                  <p className="text-xs text-slate-400">Full editing privileges</p>
                </div>
              </div>
              {currentRole === 'admin' && <CheckCircle2 className="text-teal-500" size={20} />}
            </button>

            <button 
              onClick={() => handleRoleSwitch('user')}
              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${currentRole === 'user' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${currentRole === 'user' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <GraduationCap size={20} />
                </div>
                <div className="text-left">
                  <p className={`font-bold ${currentRole === 'user' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>Student User</p>
                  <p className="text-xs text-slate-400">Standard view-only access</p>
                </div>
              </div>
              {currentRole === 'user' && <CheckCircle2 className="text-emerald-500" size={20} />}
            </button>
          </div>
        </div>

        <div className="glass p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 opacity-60">
           <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Profile Details</h3>
           <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Coming Soon.</p>
           <div className="space-y-4">
             <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl w-full animate-pulse"></div>
             <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl w-3/4 animate-pulse"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
