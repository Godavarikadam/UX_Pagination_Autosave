import React, { useState } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('editor');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await api.post('/auth/register', { email, password, role });
      setMessage('Registration successful! You can now log in.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      
      <div className="hidden lg:flex lg:w-3/4 flex-col justify-center bg-[#A1E3F9]/40 px-16 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#3674B5]/10 to-transparent z-0" />
        
        <div className="flex flex-col items-center justify-center text-center p-6 lg:p-12">
  
  <div className="relative mb-8">
    <div className="absolute inset-0 rounded-3xl bg-[#3674B5] blur-xl opacity-20 animate-pulse"></div>
    <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#3674B5] text-white shadow-2xl transform transition-transform hover:rotate-6">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    </div>
  </div>

  {/* Typography */}
  <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
    Design for <br />
    <span className="text-[#3674B5] relative inline-block">
      Reliability.
      <div className="absolute bottom-1 left-0 w-full h-1 bg-[#A1E3F9] -z-10 rounded-full"></div>
    </span>
  </h1>
  
  <p className="mt-6 text-gray-600 max-w-md font-medium text-lg leading-relaxed">
    Join a platform built for performance-aware users. Experience predictable navigation and smart data management.
  </p>

  {/* Centered Feature Tags */}
  <div className="mt-10 flex flex-wrap justify-center gap-4">
    {['Smart Auto-Save', 'Robust Pagination', 'Secure Auth'].map((item) => (
      <div 
        key={item} 
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-100 shadow-sm transition-all hover:border-[#3674B5]/30 hover:shadow-md"
      >
        <div className="h-2 w-2 rounded-full bg-[#3674B5]" />
        <span className="text-sm font-bold text-gray-700">{item}</span>
      </div>
    ))}
  </div>
</div>
      </div>

      {/* RIGHT SIDE: Form Panel (Scrollable if content exceeds screen) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 md:px-16 lg:px-20 bg-white overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create Account</h2>
            <p className="mt-2 text-sm text-gray-500 font-medium">Enter your details to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                className="w-full rounded-xl border border-gray-300 py-2.5 px-4 text-gray-900 focus:ring-2 focus:ring-[#3674B5] focus:border-transparent outline-none transition-all bg-gray-50/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Password</label>
              <input
                type="password"
                placeholder="••••••"
                className="w-full rounded-xl border border-gray-300 py-2.5 px-4 text-gray-900 focus:ring-2 focus:ring-[#3674B5] outline-none transition-all bg-gray-50/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">User Role</label>
              <select
                className="w-full rounded-xl border border-gray-300 py-2.5 px-4 text-gray-900 focus:ring-2 focus:ring-[#3674B5] outline-none bg-gray-50/50 cursor-pointer appearance-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="admin">Admin</option>
                <option value="editor">User</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg transition-all active:scale-95 mt-5
                ${loading ? "bg-gray-400" : "bg-[#3674B5] hover:bg-[#578FCA] shadow-[#3674B5]/20"}`}
            >
              {loading ? "Creating Account..." : "Register Now"}
            </button>
          </form>

          {message && (
            <div className={`mt-5 p-3.5 rounded-xl text-xs font-bold border animate-in fade-in duration-300 text-center ${
              message.includes('successful') 
                ? 'bg-green-50 text-green-700 border-green-100' 
                : 'bg-red-50 text-red-600 border-red-100'
            }`}>
              {message}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[#3674B5] hover:underline underline-offset-4">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default RegisterPage;