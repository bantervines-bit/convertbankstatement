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
  
  // Login/Signup states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Load user session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsLoggedIn(true);
    }
  }, []);

  // Save user session
  const saveUserSession = (user) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  // Handle Login
  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (!loginEmail || !loginPassword) {
      setAuthError('Please fill in all fields');
      return;
    }

    // Get users from storage
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

  // Handle Signup
  const handleSignup = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    // Validation
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

    // Check if email already exists
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.email === signupEmail)) {
      setAuthError('Email already registered. Please login.');
      return;
    }

    // Create new user
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

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentPage('landing');
  };

  // Update user data in storage
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
              <li><button className="hover:text-white">API</button></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li><button onClick={() => setCurrentPage('about')} className="hover:text-white">About</button></li>
              <li><button onClick={() => setCurrentPage('contact')} className="hover:text-white">Contact</button></li>
              <li><button className="hover:text-white">Blog</button></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-gray-400">
              <li><button onClick={() => setCurrentPage('privacy')} className="hover:text-white">Privacy Policy</button></li>
              <li><button onClick={() => setCurrentPage('terms')} className="hover:text-white">Terms of Service</button></li>
              <li><button className="hover:text-white">Cookie Policy</button></li>
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

        <div className="py-16">
          <h2 className="text-3xl font-bold text-center mb-12">Plans & Usage Limits</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-md border-2 border-gray-200">
              <h3 className="text-2xl font-bold mb-4">Free</h3>
              <p className="text-gray-600 mb-4">Perfect for trying out</p>
              <p className="text-3xl font-bold text-blue-600 mb-4">$0</p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ 2 conversions/day</li>
                <li>✓ Basic support</li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md border-2 border-blue-600 transform scale-105">
              <div className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full inline-block mb-2">POPULAR</div>
              <h3 className="text-2xl font-bold mb-4">Signed Up</h3>
              <p className="text-gray-600 mb-4">Get 25 free credits</p>
              <p className="text-3xl font-bold text-blue-600 mb-4">Free</p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ 25 credits on signup</li>
                <li>✓ 5 daily bonus credits</li>
                <li>✓ Referral rewards</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-xl shadow-lg text-white">
              <h3 className="text-2xl font-bold mb-4">Premium</h3>
              <p className="mb-4">Unlimited conversions</p>
              <p className="text-3xl font-bold mb-4">From $14/mo</p>
              <button onClick={() => setCurrentPage('pricing')} className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition w-full">
                View Plans
              </button>
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
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
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
            <input
              type="text"
              value={signupName}
              onChange={(e) => setSignupName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength="6"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              value={signupConfirmPassword}
              onChange={(e) => setSignupConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
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

  const Dashboard = () => {
    const handleFileUpload = (files) => {
      const newFiles = Array.from(files).map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2),
        pages: Math.floor(Math.random() * 5) + 1,
        status: 'pending'
      }));
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = () => {
      setIsDragging(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileUpload(e.dataTransfer.files);
    };

    const convertFiles = () => {
      setIsConverting(true);
      const totalPages = uploadedFiles.reduce((sum, file) => sum + file.pages, 0);
      
      setTimeout(() => {
        const newHistory = uploadedFiles.map(file => ({
          id: Date.now() + Math.random(),
          fileName: file.name,
          date: new Date().toISOString().split('T')[0],
          credits: file.pages,
          status: 'completed',
          pages: file.pages
        }));
        
        const updatedHistory = [...newHistory, ...(currentUser?.convertHistory || [])];
        const newCreditsUsage = uploadedFiles.map(file => ({
          id: Date.now() + Math.random(),
          fileName: file.name,
          date: new Date().toISOString().split('T')[0],
          creditsUsed: file.pages,
          type: 'conversion'
        }));
        
        const updatedCreditUsage = [...newCreditsUsage, ...(currentUser?.creditUsage || [])];
        
        updateUserData({
          credits: currentUser.credits - totalPages,
          convertHistory: updatedHistory,
          creditUsage: updatedCreditUsage
        });
        
        setUploadedFiles([]);
        setIsConverting(false);
      }, 3000);
    };

    const removeFile = (id) => {
      setUploadedFiles(uploadedFiles.filter(file => file.id !== id));
    };

    if (!isLoggedIn) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
            <p className="text-gray-600 mb-6">You need to be logged in to access the dashboard</p>
            <button
              onClick={() => setCurrentPage('login')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {currentUser?.name}!</h1>
            <p className="text-gray-600">Upload and convert your bank statements</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Conversions</p>
                  <p className="text-3xl font-bold text-green-600">{currentUser?.convertHistory?.length || 0}</p>
                </div>
                <FileText className="h-12 w-12 text-green-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pages Converted</p>
                  <p className="text-3xl font-bold text-purple-600">{currentUser?.convertHistory?.reduce((sum, item) => sum + item.pages, 0) || 0}</p>
                </div>
                <CheckCircle className="h-12 w-12 text-purple-600 opacity-20" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <h2 className="text-xl font-bold mb-4">Upload Files</h2>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition ${
                isDragging ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-700 mb-2">
                Drag and drop your files here
              </p>
              <p className="text-gray-500 mb-4">or</p>
              <label className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition cursor-pointer inline-block">
                Browse Files
                <input
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </label>
              <p className="text-sm text-gray-500 mt-4">Supports PDF and image files (JPG, PNG)</p>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <h2 className="text-xl font-bold mb-4">Uploaded Files ({uploadedFiles.length})</h2>
              <div className="space-y-4">
                {uploadedFiles.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-semibold">{file.name}</p>
                        <p className="text-sm text-gray-500">{file.size} MB • {file.pages} pages • {file.pages} credits</p>
                      </div>
                    </div>
                    <button onClick={() => removeFile(file.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <p className="text-gray-600">
                  Total credits needed: <span className="font-bold text-blue-600">{uploadedFiles.reduce((sum, file) => sum + file.pages, 0)}</span>
                </p>
                <button
                  onClick={convertFiles}
                  disabled={isConverting || currentUser.credits < uploadedFiles.reduce((sum, file) => sum + file.pages, 0)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isConverting ? 'Converting...' : 'Convert All'}
                </button>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-bold mb-2">Secure</h3>
              <p className="text-sm text-gray-600">Data encrypted and auto-deleted</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-bold mb-2">Fast</h3>
              <p className="text-sm text-gray-600">Converts in seconds</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-bold mb-2">Precise</h3>
              <p className="text-sm text-gray-600">High accuracy extraction</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <details className="border-b pb-4">
                <summary className="font-semibold cursor-pointer">How many credits do I need?</summary>
                <p className="text-gray-600 mt-2">1 credit = 1 page. A 5-page PDF requires 5 credits.</p>
              </details>
              <details className="border-b pb-4">
                <summary className="font-semibold cursor-pointer">What file formats are supported?</summary>
                <p className="text-gray-600 mt-2">We support PDF files and images (JPG, PNG) of bank statements.</p>
              </details>
              <details className="border-b pb-4">
                <summary className="font-semibold cursor-pointer">Is my data secure?</summary>
                <p className="text-gray-600 mt-2">Yes! All data is encrypted and automatically deleted after conversion.</p>
              </details>
              <details className="pb-4">
                <summary className="font-semibold cursor-pointer">How do I earn more credits?</summary>
                <p className="text-gray-600 mt-2">Share your referral link! You get 15 credits for each signup.</p>
              </details>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PricingPage = () => {
    const monthlyPlans = [
      { name: 'Beginner', price: 14, credits: 500, features: ['500 credits/month', 'Email support', 'Basic features', '1 user'] },
      { name: 'Professional', price: 29, credits: 1100, features: ['1100 credits/month', 'Priority support', 'All features', 'Up to 5 users'], popular: true },
      { name: 'Business', price: 49, credits: 4500, features: ['4500 credits/month', 'Dedicated support', 'API access', 'Unlimited users'] },
      { name: 'Enterprise', price: 'Custom', credits: 'Unlimited', features: ['Custom credits', '24/7 support', 'Custom integrations', 'SLA guarantee'] }
    ];

    const yearlyPlans = [
      { name: 'Beginner', price: 99, credits: '6000', features: ['500 credits/month', 'Email support', 'Basic features', '1 user'], save: '30%' },
      { name: 'Professional', price: 199, credits: '13200', features: ['1100 credits/month', 'Priority support', 'All features', 'Up to 5 users'], popular: true, save: '42%' },
      { name: 'Business', price: 299, credits: '54000', features: ['4500 credits/month', 'Dedicated support', 'API access', 'Unlimited users'], save: '49%' },
      { name: 'Enterprise', price: 'Custom', credits: 'Unlimited', features: ['Custom credits', '24/7 support', 'Custom integrations', 'SLA guarantee'] }
    ];

    const plans = pricingPeriod === 'monthly' ? monthlyPlans : yearlyPlans;

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-gray-600 mb-8">Choose the plan that fits your needs</p>
            
            <div className="inline-flex bg-white rounded-lg p-1 shadow-md">
              <button
                onClick={() => setPricingPeriod('monthly')}
                className={`px-6 py-2 rounded-lg transition ${
                  pricingPeriod === 'monthly' ? 'bg-blue-600 text-white' : 'text-gray-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPricingPeriod('yearly')}
                className={`px-6 py-2 rounded-lg transition ${
                  pricingPeriod === 'yearly' ? 'bg-blue-600 text-white' : 'text-gray-600'
                }`}
              >
                Yearly
                <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">Save up to 49%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl shadow-lg p-8 relative ${
                  plan.popular ? 'border-2 border-blue-600 transform scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                {plan.save && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      Save {plan.save}
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-blue-600">
                    {typeof plan.price === 'number' ? `${plan.price}` : plan.price}
                  </span>
                  {typeof plan.price === 'number' && (
                    <span className="text-gray-600">/{pricingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                  )}
                </div>
                <p className="text-gray-600 mb-6">{plan.credits} credits</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    if (!isLoggedIn) {
                      setCurrentPage('signup');
                    } else {
                      setCurrentPage('dashboard');
                    }
                  }}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>

          <div className="text-center bg-blue-600 text-white rounded-xl p-12">
            <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
            <p className="text-xl mb-6">Our team is here to help you choose the right plan</p>
            <button onClick={() => setCurrentPage('contact')} className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
              Contact Sales
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  };

  const CreditsPage = () => {
    if (!isLoggedIn) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
            <button onClick={() => setCurrentPage('login')} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
              Go to Login
            </button>
          </div>
        </div>
      );
    }

    const copyReferralLink = () => {
      navigator.clipboard.writeText(`https://convertbankstatement.com/ref/${currentUser.referralCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Credits Management</h1>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-8 rounded-xl shadow-lg">
              <p className="text-sm opacity-90 mb-2">Available Credits</p>
              <p className="text-5xl font-bold mb-4">{currentUser?.credits || 0}</p>
              <button onClick={() => setCurrentPage('pricing')} className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition w-full">
                Buy More Credits
              </button>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md">
              <p className="text-gray-600 mb-2">Credits Used</p>
              <p className="text-4xl font-bold text-gray-900 mb-4">
                {currentUser?.creditUsage?.filter(c => c.type === 'conversion').reduce((sum, c) => sum + c.creditsUsed, 0) || 0}
              </p>
              <p className="text-sm text-gray-500">From {currentUser?.creditUsage?.filter(c => c.type === 'conversion').length || 0} conversions</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md">
              <p className="text-gray-600 mb-2">Credits Earned</p>
              <p className="text-4xl font-bold text-green-600 mb-4">
                {Math.abs(currentUser?.creditUsage?.filter(c => c.type === 'earned').reduce((sum, c) => sum + c.creditsUsed, 0) || 0)}
              </p>
              <p className="text-sm text-gray-500">From referrals & bonuses</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Gift className="h-6 w-6 text-blue-600 mr-2" />
              Earn More Credits
            </h2>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
              <h3 className="font-bold text-lg mb-2">Referral Program</h3>
              <p className="text-gray-700 mb-4">Share your unique referral link and earn 15 free credits for each person who signs up!</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`https://convertbankstatement.com/ref/${currentUser?.referralCode}`}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white"
                />
                <button
                  onClick={copyReferralLink}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
                >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  <span className="ml-2">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="border-2 border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">How Credits Work</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• 1 credit = 1 page converted</li>
                  <li>• Credits never expire</li>
                  <li>• Get 25 credits on signup</li>
                  <li>• Premium users get bonus credits</li>
                </ul>
              </div>
              <div className="border-2 border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Ways to Earn Free Credits</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Refer friends: +15 credits each</li>
                  <li>• Daily login bonus: +5 credits</li>
                  <li>• Complete profile: +10 credits</li>
                  <li>• Monthly loyalty bonus: +20 credits</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold mb-4">Credit Usage History</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Description</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-right py-3 px-4">Credits</th>
                    <th className="text-right py-3 px-4">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUser?.creditUsage?.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{item.fileName}</td>
                      <td className="py-3 px-4 text-gray-600">{item.date}</td>
                      <td className={`py-3 px-4 text-right font-semibold ${item.creditsUsed < 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.creditsUsed < 0 ? '+' : '-'}{Math.abs(item.creditsUsed)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.type === 'earned' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.type === 'earned' ? 'Earned' : 'Used'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const HistoryPage = () => {
    if (!isLoggedIn) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
            <button onClick={() => setCurrentPage('login')} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
              Go to Login
            </button>
          </div>
        </div>
      );
    }

    const downloadFile = (fileName) => {
      alert(`Downloading ${fileName.replace('.pdf', '.xlsx')}`);
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Conversion History</h1>

          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Recent Conversions</h2>
              <p className="text-gray-600">{currentUser?.convertHistory?.length || 0} total conversions</p>
            </div>

            {currentUser?.convertHistory?.length > 0 ? (
              <div className="space-y-4">
                {currentUser.convertHistory.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{item.fileName}</p>
                          <p className="text-sm text-gray-600">
                            {item.date} • {item.pages} pages • {item.credits} credits used
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Completed
                        </span>
                        <button
                          onClick={() => downloadFile(item.fileName)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No conversions yet. Start by uploading a file!</p>
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ProfilePage = () => {
    if (!isLoggedIn) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
            <button onClick={() => setCurrentPage('login')} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
              Go to Login
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>

          <div className="bg-white rounded-xl shadow-md p-8 mb-6">
            <h2 className="text-xl font-bold mb-6">Account Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input type="text" defaultValue={currentUser?.name} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input type="email" defaultValue={currentUser?.email} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Member Since</label>
                <input type="text" defaultValue={new Date(currentUser?.joinDate).toLocaleDateString()} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" />
              </div>
            </div>
            <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              Save Changes
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-xl font-bold mb-6 text-red-600">Danger Zone</h2>
            <p className="text-gray-600 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
            <button onClick={handleLogout} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ContactPage = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">Contact Us</h1>
        <p className="text-xl text-gray-600 mb-12 text-center">We'd love to hear from you</p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <textarea rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"></textarea>
              </div>
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold">
                Send Message
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold mb-2">Email</h3>
              <p className="text-gray-600">support@convertbankstatement.com</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold mb-2">Phone</h3>
              <p className="text-gray-600">+1 (555) 123-4567</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold mb-2">Address</h3>
              <p className="text-gray-600">123 Finance Street<br />San Francisco, CA 94102</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );

  const AboutPage = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">About Us</h1>
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <p className="text-lg text-gray-700 mb-4">
            ConvertBankStatement was founded with a simple mission: to make financial data more accessible and easier to work with.
          </p>
          <p className="text-lg text-gray-700 mb-4">
            We understand the frustration of manually entering bank statement data into spreadsheets. That's why we built an AI-powered solution that converts your PDF bank statements into clean, editable Excel files in seconds.
          </p>
          <p className="text-lg text-gray-700">
            Our platform serves thousands of users worldwide, from individual freelancers to large enterprises, helping them save time and reduce errors in their financial workflows.
          </p>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Values</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <Lock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Security First</h3>
            <p className="text-gray-600">Your data privacy is our top priority</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Speed & Efficiency</h3>
            <p className="text-gray-600">Fast conversions without compromising quality</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <CheckCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Accuracy</h3>
            <p className="text-gray-600">Precise data extraction every time</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );

  const PrivacyPage = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-3">1. Information We Collect</h2>
            <p className="text-gray-700">We collect information you provide directly to us, including your name, email address, and payment information. When you upload bank statements, we temporarily process this data to perform the conversion service.</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-3">2. How We Use Your Information</h2>
            <p className="text-gray-700">We use the information we collect to provide, maintain, and improve our services, process your transactions, and communicate with you about our services.</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-3">3. Data Security</h2>
            <p className="text-gray-700">We implement robust security measures to protect your data. All uploaded files are encrypted in transit and at rest. Files are automatically deleted from our servers within 24 hours of conversion.</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-3">4. Your Rights</h2>
            <p className="text-gray-700">You have the right to access, update, or delete your personal information at any time. You can also request a copy of your data or object to certain processing activities.</p>
          </div>
          <p className="text-sm text-gray-500 pt-4 border-t">Last updated: October 30, 2025</p>
        </div>
      </div>
      <Footer />
    </div>
  );

  const TermsPage = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-700">By accessing and using ConvertBankStatement, you accept and agree to be bound by the terms and provision of this agreement.</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-3">2. Service Description</h2>
            <p className="text-gray-700">ConvertBankStatement provides an automated service to convert PDF bank statements to Excel format. We strive for accuracy but do not guarantee 100% error-free conversions.</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-3">3. User Obligations</h2>
            <p className="text-gray-700">You agree to use the service only for lawful purposes and in accordance with these Terms. You are responsible for maintaining the confidentiality of your account credentials.</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-3">4. Payment Terms</h2>
            <p className="text-gray-700">Subscription fees are billed in advance on a monthly or yearly basis. Credits are non-refundable but never expire.</p>
          </div>
          <p className="text-sm text-gray-500 pt-4 border-t">Last updated: October 30, 2025</p>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      {currentPage === 'landing' && <LandingPage />}
      {currentPage === 'login' && <LoginPage />}
      {currentPage === 'signup' && <SignupPage />}
      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'pricing' && <PricingPage />}
      {currentPage === 'credits' && <CreditsPage />}
      {currentPage === 'history' && <HistoryPage />}
      {currentPage === 'profile' && <ProfilePage />}
      {currentPage === 'contact' && <ContactPage />}
      {currentPage === 'about' && <AboutPage />}
      {currentPage === 'privacy' && <PrivacyPage />}
      {currentPage === 'terms' && <TermsPage />}
    </div>
  );
};

export default App;-between">
                <div>
                  <p className="text-gray-600 text-sm">Available Credits</p>
                  <p className="text-3xl font-bold text-blue-600">{currentUser?.credits || 0}</p>
                </div>
                <CreditCard className="h-12 w-12 text-blue-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify
