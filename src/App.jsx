import React, { useState, useEffect } from 'react';
import { Upload, Lock, Zap, CheckCircle, Menu, X, FileText, LogOut, User, CreditCard, History as HistoryIcon, Gift, Download, Trash2, Copy, Check } from 'lucide-react';

const App = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pricingPeriod, setPricingPeriod] = useState('monthly');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsLoggedIn(true);
    }
  }, []);

  const saveUserSession = (user) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (!loginEmail || !loginPassword) {
      setAuthError('Please fill in all fields');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === loginEmail);

    if (!user) {
      setAuthError('User not found. Please sign up first.');
      return;
    }

    if (user.password !== loginPassword) {
      setAuthError('Incorrect password');
      return;
    }

    saveUserSession(user);
    setCurrentPage('dashboard');
    setLoginEmail('');
    setLoginPassword('');
  };

  const handleSignup = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!signupName || !signupEmail || !signupPassword || !signupConfirmPassword) {
      setAuthError('Please fill in all fields');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }

    if (signupPassword.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.email === signupEmail)) {
      setAuthError('Email already registered. Please login.');
      return;
    }

    const newUser = {
      id: Date.now(),
      name: signupName,
      email: signupEmail,
      password: signupPassword,
      credits: 25,
      referralCode: 'REF' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      joinDate: new Date().toISOString(),
      convertHistory: [],
      creditUsage: [
        { id: 1, fileName: 'Welcome Bonus', date: new Date().toISOString().split('T')[0], creditsUsed: -25, type: 'earned' }
      ]
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    setAuthSuccess('Account created successfully! Logging you in...');
    setTimeout(() => {
      saveUserSession(newUser);
      setCurrentPage('dashboard');
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupConfirmPassword('');
    }, 1500);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentPage('landing');
  };

  const updateUserData = (updates) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates };
      localStorage.setItem('users', JSON.stringify(users));
      saveUserSession(users[userIndex]);
    }
  };
  const Navigation = () => (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer" onClick={() => setCurrentPage('landing')}>
            <FileText className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">ConvertBankStatement</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => setCurrentPage('pricing')} className="text-gray-700 hover:text-blue-600 transition">Pricing</button>
            {isLoggedIn ? (
              <>
                <button onClick={() => setCurrentPage('dashboard')} className="text-gray-700 hover:text-blue-600 transition">Dashboard</button>
                <button onClick={() => setCurrentPage('credits')} className="text-gray-700 hover:text-blue-600 transition flex items-center bg-blue-50 px-3 py-1 rounded-full">
                  <CreditCard className="h-4 w-4 mr-1 text-blue-600" />
                  <span className="font-semibold text-blue-600">{currentUser?.credits || 0}</span>
                </button>
                <button onClick={() => setCurrentPage('history')} className="text-gray-700 hover:text-blue-600 transition">History</button>
                <button onClick={() => setCurrentPage('profile')} className="text-gray-700 hover:text-blue-600 transition">
                  <User className="h-5 w-5" />
                </button>
                <button onClick={handleLogout} className="text-gray-700 hover:text-red-600 transition">
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setCurrentPage('login')} className="text-gray-700 hover:text-blue-600 transition">Login</button>
                <button onClick={() => setCurrentPage('signup')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition shadow-md">
                  Sign Up
                </button>
              </>
            )}
          </div>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-3 space-y-3">
            <button onClick={() => { setCurrentPage('pricing'); setMobileMenuOpen(false); }} className="block w-full text-left text-gray-700">Pricing</button>
            {isLoggedIn ? (
              <>
                <button onClick={() => { setCurrentPage('dashboard'); setMobileMenuOpen(false); }} className="block w-full text-left text-gray-700">Dashboard</button>
                <button onClick={() => { setCurrentPage('credits'); setMobileMenuOpen(false); }} className="block w-full text-left text-gray-700">Credits ({currentUser?.credits || 0})</button>
                <button onClick={() => { setCurrentPage('history'); setMobileMenuOpen(false); }} className="block w-full text-left text-gray-700">History</button>
                <button onClick={() => { setCurrentPage('profile'); setMobileMenuOpen(false); }} className="block w-full text-left text-gray-700">Profile</button>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="block w-full text-left text-red-600">Logout</button>
              </>
            ) : (
              <>
                <button onClick={() => { setCurrentPage('login'); setMobileMenuOpen(false); }} className="block w-full text-left text-gray-700">Login</button>
                <button onClick={() => { setCurrentPage('signup'); setMobileMenuOpen(false); }} className="block w-full text-left bg-blue-600 text-white px-4 py-2 rounded-lg">Sign Up</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );

  const Footer = () => (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <FileText className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-xl font-bold">ConvertBankStatement</span>
            </div>
            <p className="text-gray-400">Convert bank statements to Excel instantly.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-gray-400">
              <li><button onClick={() => setCurrentPage('pricing')} className="hover:text-white">Pricing</button></li>
              <li><button className="hover:text-white">Features</button></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li><button onClick={() => setCurrentPage('about')} className="hover:text-white">About</button></li>
              <li><button onClick={() => setCurrentPage('contact')} className="hover:text-white">Contact</button></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-gray-400">
              <li><button onClick={() => setCurrentPage('privacy')} className="hover:text-white">Privacy Policy</button></li>
              <li><button onClick={() => setCurrentPage('terms')} className="hover:text-white">Terms of Service</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>© 2025 ConvertBankStatement. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );

  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-20">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Convert Your Bank Statement<br />to Excel Instantly
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload your PDF bank statements and get clean, editable Excel files in seconds — fast, secure, and precise.
          </p>
          <button onClick={() => isLoggedIn ? setCurrentPage('dashboard') : setCurrentPage('signup')} className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl inline-flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            {isLoggedIn ? 'Upload PDF' : 'Get Started Free'}
          </button>
          <p className="text-sm text-gray-500 mt-4">Signed users get 25 free credits to start</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 py-16">
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Secure</h3>
            <p className="text-gray-600">Your data is encrypted and automatically deleted after conversion.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Fast</h3>
            <p className="text-gray-600">Convert PDF to XLS in seconds with high accuracy.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Precise</h3>
            <p className="text-gray-600">Extracts every transaction and formats it cleanly in Excel.</p>
          </div>
        </div>

        <div className="py-16 bg-white rounded-2xl shadow-lg my-16 px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How ConvertBankStatement Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="text-lg font-semibold mb-2">Upload your PDF file</h3>
              <p className="text-gray-600">Drag and drop or click to upload your bank statement</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="text-lg font-semibold mb-2">AI processes and extracts data</h3>
              <p className="text-gray-600">Our AI reads and extracts transaction details accurately</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="text-lg font-semibold mb-2">Download Excel file instantly</h3>
              <p className="text-gray-600">Get your formatted Excel file ready to use</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );

  const LoginPage = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your account</p>
        </div>
        {authError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {authError}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent" placeholder="••••••••" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold">
            Sign In
          </button>
        </form>
        <p className="text-center text-gray-600 mt-6">
          Don't have an account?{' '}
          <button onClick={() => { setCurrentPage('signup'); setAuthError(''); }} className="text-blue-600 font-semibold hover:underline">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );

  const SignupPage = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-600">Get 25 free credits to start!</p>
        </div>
        {authError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {authError}
          </div>
        )}
        {authSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {authSuccess}
          </div>
        )}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <input type="text" value={signupName} onChange={(e) => setSignupName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent" placeholder="John Doe" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent" placeholder="••••••••" required minLength="6" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
            <input type="password" value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent" placeholder="••••••••" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold">
            Create Account
          </button>
        </form>
        <p className="text-center text-gray-600 mt-6">
          Already have an account?{' '}
          <button onClick={() => { setCurrentPage('login'); setAuthError(''); setAuthSuccess(''); }} className="text-blue-600 font-semibold hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
  
