import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';

function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      setError('');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      if (msg.toLowerCase().includes('locked')) setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const isLocked = error.toLowerCase().includes('locked');

  return (
    <div className="flex min-h-screen bg-white">
   
      <div className="hidden lg:flex lg:w-3/4 items-center justify-center bg-[#A1E3F9]/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#3674B5]/10 to-transparent" />
        <div className="z-10 text-center px-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#3674B5] text-white shadow-2xl mb-8 transform -rotate-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
  <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
  Predictable <br />
  <span className="text-[#3674B5] relative inline-block">
    Navigation.
    <div className="absolute bottom-1 left-0 w-full h-1 bg-[#A1E3F9] -z-10 rounded-full"></div>
  </span>
</h1>

<p className="mt-6 text-gray-600 max-w-md font-medium text-lg leading-relaxed">
  Never lose your place. Our advanced pagination engine preserves your context through every edit, ensuring a stable experience without unexpected page resets.
</p>
        </div>
       
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-[#3674B5]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 text-center">Welcome Back</h2>
            <p className="mt-2 text-sm text-gray-500 text-center">Please enter your credentials to access your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="name@gmail.com"
                className="block w-full rounded-xl border border-gray-400 py-2.5 px-4 text-gray-900 shadow-sm focus:ring-2 focus:ring-[#3674B5] focus:border-transparent outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Password</label>
             
              </div>
              <input
                type="password"
                placeholder="••••••"
                className="block w-full border border-gray-400 rounded-xl py-2.5 px-4 text-gray-900 shadow-sm focus:ring-2 focus:ring-[#3674B5] outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || isLocked}
              />
            </div>

            <button
              type="submit"
              disabled={loading || isLocked}
              className={`w-full flex justify-center items-center gap-2 rounded-xl py-4 text-sm font-bold text-white shadow-lg transition-all active:scale-95 text-center
                ${(loading || isLocked) 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-[#3674B5] hover:bg-[#578FCA]"}`}
            >
              {loading ? "Authenticating..." : isLocked ? "Account Temporarily Locked" : "Sign In"}
            </button>
          </form>

          {error && (
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600 border border-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-[#3674B5] hover:underline">
                Register now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;