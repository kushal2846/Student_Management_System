import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogIn, User, Lock, Shield, GraduationCap } from 'lucide-react';

const Login = () => {
  const [role, setRole] = useState('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem(`saved_username_${role}`);
    const savedPass = localStorage.getItem(`saved_password_${role}`);
    
    if (savedUser && savedPass) {
      setUsername(savedUser);
      setPassword(savedPass);
      setRememberMe(true);
    } else {
      setUsername(role === 'admin' ? 'admin' : 'user');
      setPassword(role === 'admin' ? 'Admin@123' : 'User@123');
      setRememberMe(false);
    }
  }, [role]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/token/', {
        username,
        password
      });

      if (rememberMe) {
        localStorage.setItem(`saved_username_${role}`, username);
        localStorage.setItem(`saved_password_${role}`, password);
      } else {
        localStorage.removeItem(`saved_username_${role}`);
        localStorage.removeItem(`saved_password_${role}`);
      }

      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      localStorage.setItem('login_toast', `Welcome to ${role === 'admin' ? 'Admin' : 'User'} page!`);
      // Optional: actually force set the user_role for instant UI changes
      localStorage.setItem('user_role', role);
      navigate('/');
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass p-8 sm:p-12 rounded-[2.5rem] w-full max-w-md z-10 mx-4 border border-white/20 shadow-2xl"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
            className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 shadow-xl transform rotate-3 hover:rotate-6 transition-transform ${role === 'admin' ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/30' : 'bg-gradient-to-tr from-emerald-400 to-blue-500 shadow-blue-500/30'}`}
          >
            {role === 'admin' ? <Shield className="w-10 h-10 text-white transform -rotate-3" /> : <GraduationCap className="w-10 h-10 text-white transform -rotate-3" />}
          </motion.div>
          <h2 className="text-3xl font-extrabold text-slate-800">Welcome Back</h2>
          <p className="text-slate-500 mt-2 font-medium">Log in to your {role === 'admin' ? 'Administrator' : 'Student'} account</p>
        </div>

        {/* Role Toggle Tabs */}
        <div className="flex p-1 bg-slate-100/50 rounded-2xl mb-8 border border-white/40 shadow-inner">
           <button type="button" onClick={() => setRole('admin')} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 ${role === 'admin' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Shield size={16} /> Admin
           </button>
           <button type="button" onClick={() => setRole('user')} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 ${role === 'user' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <GraduationCap size={16} /> Student
           </button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-3 bg-red-100/80 border border-red-200 text-red-600 rounded-xl text-sm text-center font-bold">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full pl-12 pr-4 py-3.5 bg-white/70 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800 font-bold shadow-sm"
              placeholder="Username"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-12 pr-4 py-3.5 bg-white/70 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800 font-bold shadow-sm"
              placeholder="Password"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              id="remember_me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded cursor-pointer"
            />
            <label htmlFor="remember_me" className="ml-2 block text-sm text-slate-700 font-bold cursor-pointer">
              Remember me
            </label>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg mt-2 text-base font-black text-white hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all font-sans tracking-wide ${role === 'admin' ? 'bg-gradient-to-r from-teal-600 to-emerald-600 focus:ring-teal-500 shadow-teal-500/30' : 'bg-gradient-to-r from-blue-500 to-cyan-600 focus:ring-blue-500 shadow-blue-500/30'}`}
          >
            Sign In as {role === 'admin' ? 'Administrator' : 'Student'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
