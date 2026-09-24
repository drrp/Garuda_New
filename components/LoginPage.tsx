import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from './Icon';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      login(name, email);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-sky-400">GARUDA</h1>
          <p className="text-slate-400 mt-2">AUCHITHYAM Paper Formatter</p>
        </div>
        <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700 shadow-2xl min-h-[320px] flex flex-col justify-center items-center">
          <p className="text-center text-slate-300 mb-8">
            Sign in to create your personal workspace and access your paper formatting history.
          </p>
          
          {showForm ? (
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 animate-fade-in-scale">
              <div>
                <label htmlFor="name" className="sr-only">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                />
              </div>
              <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                Continue
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="bg-white text-slate-800 font-semibold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-200 transition-colors duration-200 flex items-center justify-center gap-3"
            >
              <Icon name="google" className="w-5 h-5" />
              Sign in with Google
            </button>
          )}

        </div>
        <footer className="text-center py-6 text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} AUCHITHYAM. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;