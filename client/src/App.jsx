import React, { useState, useEffect } from 'react';
import { Shield, User, LogOut, Lock, Mail, FileText, CheckCircle, Info, X, Menu } from 'lucide-react';
import { api, getAuthToken, setAuthToken } from './utils/api';

// Pages
import LandingPage from './pages/LandingPage';
import Articles from './pages/Articles';
import News from './pages/News';
import Workshops from './pages/Workshops';
import LearningPortal from './pages/LearningPortal';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Community from './pages/Community';

export default function App() {
  const [page, setPage] = useState('landing');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingBlogCount, setPendingBlogCount] = useState(0);
  const [adminNavTarget, setAdminNavTarget] = useState(null);

  // Detail view parameters
  const [selectedWorkshopId, setSelectedWorkshopId] = useState(null);
  const [selectedArticleId, setSelectedArticleId] = useState(null);

  // Authentication Modal Toggle
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Toasts Alerts System
  const [toasts, setToasts] = useState([]);

  // Auth Input States
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [isDbOffline, setIsDbOffline] = useState(false);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Check database status
  const checkDatabaseStatus = async () => {
    try {
      await api.get('/articles');
    } catch (err) {
      if (err.message?.includes("buffering timed out") || err.message?.includes("connection") || err.message?.includes("refused")) {
        setIsDbOffline(true);
      }
    }
  };

  // Perform profile check if token exists
  const checkSession = async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/profile');
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        setAuthToken(null);
      }
    } catch (err) {
      console.warn("Session validation failed. User is guest.");
      if (err.message?.includes("buffering timed out")) {
        setIsDbOffline(true);
      }
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
    checkDatabaseStatus();
  }, []);

  // Refresh the admin pending-blog-review badge count using the real API
  const refreshPendingBlogCount = async () => {
    if (!user || user.role !== 'admin') {
      setPendingBlogCount(0);
      return;
    }
    try {
      const res = await api.get('/blogs/admin?status=pending');
      if (res.success) {
        setPendingBlogCount(res.total || res.data?.length || 0);
      } else {
        setPendingBlogCount(0);
      }
    } catch (err) {
      setPendingBlogCount(0);
    }
  };

  useEffect(() => {
    if (user) {
      refreshPendingBlogCount();
    }
  }, [user]);

  // Keep the badge fresh while the admin is working in the console
  useEffect(() => {
    if (page === 'admin') {
      refreshPendingBlogCount();
    }
  }, [page]);

  const handleAdminNavClick = () => {
    setPage('admin');
    setSelectedWorkshopId(null);
    setSelectedArticleId(null);
    setMobileMenuOpen(false);
    if (pendingBlogCount > 0) {
      setAdminNavTarget('community');
    }
  };

  // Handle Login & Signup
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegisterMode) {
        if (authForm.password !== authForm.confirmPassword) {
          addToast("Passwords do not match!", "error");
          return;
        }

        const res = await api.post('/auth/register', {
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          confirmPassword: authForm.confirmPassword
        });

        if (res.success) {
          addToast("Registration successful! Please login.", "success");
          setIsRegisterMode(false);
          setAuthForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
        }
      } else {
        const res = await api.post('/auth/login', {
          email: authForm.email,
          password: authForm.password
        });

        if (res.success && res.token) {
          setAuthToken(res.token);
          setUser(res.data);
          addToast("Welcome back! Login successful.", "success");
          setAuthModalOpen(false);
          setAuthForm({ name: '', email: '', password: '', confirmPassword: '' });
        }
      }
    } catch (err) {
      addToast(err.message || "Authentication failed", "error");
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (e) {
      // Clean local storage anyway
    }
    setAuthToken(null);
    setUser(null);
    addToast("Logged out successfully.", "info");
    setPage('landing');
  };

  const navigateToPage = (target) => {
    setPage(target);
    setSelectedWorkshopId(null);
    setSelectedArticleId(null);
  };

  // Component Router
  const renderPage = () => {
    if (loading) {
      return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Configuring sandbox context...</div>;
    }

    switch (page) {
      case 'landing':
        return (
          <LandingPage 
            setPage={setPage} 
            setSelectedWorkshopId={setSelectedWorkshopId} 
            setSelectedArticleId={setSelectedArticleId}
            addToast={addToast} 
          />
        );
      case 'articles':
        return (
          <Articles 
            selectedArticleId={selectedArticleId}
            setSelectedArticleId={setSelectedArticleId}
            addToast={addToast} 
          />
        );
      case 'news':
        return <News addToast={addToast} />;
      case 'workshops':
        return (
          <Workshops 
            user={user} 
            setPage={setPage} 
            setSelectedWorkshopId={setSelectedWorkshopId} 
            addToast={addToast}
            setLoginModalOpen={setAuthModalOpen}
          />
        );
      case 'learning-portal':
        return (
          <LearningPortal 
            user={user} 
            workshopId={selectedWorkshopId} 
            setPage={setPage} 
            addToast={addToast} 
          />
        );
      case 'dashboard':
        return (
          <Dashboard 
            user={user} 
            setUser={setUser}
            setPage={setPage} 
            setSelectedWorkshopId={setSelectedWorkshopId} 
            addToast={addToast} 
          />
        );
      case 'admin':
        return (
          <AdminPanel 
            addToast={addToast} 
            requestedTab={adminNavTarget}
            onRequestedTabHandled={() => setAdminNavTarget(null)}
            refreshPendingCount={refreshPendingBlogCount}
          />
        );
      case 'community':
        return (
          <Community 
            user={user} 
            setPage={setPage} 
            setSelectedWorkshopId={setSelectedWorkshopId} 
            addToast={addToast} 
            setLoginModalOpen={setAuthModalOpen}
          />
        );
      default:
        return <LandingPage setPage={setPage} setSelectedWorkshopId={setSelectedWorkshopId} addToast={addToast} />;
    }
  };

  return (
    <div className="app-container">
      {isDbOffline && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          textAlign: 'center',
          padding: '0.5rem 1rem',
          fontSize: '0.85rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          letterSpacing: '0.01em',
          backdropFilter: 'blur(8px)'
        }}>
          <Shield size={16} /> Offline Demonstration Mode: Database connection is offline. Some features may be unavailable.
        </div>
      )}
      {/* Navigation Header */}
      <header className="navbar">
        <div className="brand" onClick={() => navigateToPage('landing')}>
          <Shield size={26} /> CyberGuard
        </div>

        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={`nav-menu-wrapper ${mobileMenuOpen ? 'open' : ''}`}>
          <ul className="nav-links">
            <li className={`nav-item ${page === 'landing' ? 'active' : ''}`} onClick={() => { navigateToPage('landing'); setMobileMenuOpen(false); }}>Home</li>
            <li className={`nav-item ${page === 'articles' ? 'active' : ''}`} onClick={() => { navigateToPage('articles'); setMobileMenuOpen(false); }}>Guides</li>
            <li className={`nav-item ${page === 'news' ? 'active' : ''}`} onClick={() => { navigateToPage('news'); setMobileMenuOpen(false); }}>Scam alerts</li>
            <li className={`nav-item ${page === 'workshops' ? 'active' : ''}`} onClick={() => { navigateToPage('workshops'); setMobileMenuOpen(false); }}>Workshops</li>
            <li className={`nav-item ${page === 'community' ? 'active' : ''}`} onClick={() => { navigateToPage('community'); setMobileMenuOpen(false); }}>Community</li>
            
            {user && (
              <li className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} onClick={() => { navigateToPage('dashboard'); setMobileMenuOpen(false); }}>Dashboard</li>
            )}

            {user?.role === 'admin' && (
              <li className={`nav-item ${page === 'admin' ? 'active' : ''}`} onClick={handleAdminNavClick}>
                Admin Control
                {pendingBlogCount > 0 && (
                  <span className="nav-notification-badge" title={`${pendingBlogCount} pending community post${pendingBlogCount === 1 ? '' : 's'} awaiting review`}>
                    {pendingBlogCount}
                  </span>
                )}
              </li>
            )}
          </ul>

          <div className="auth-button-container">
            {user ? (
              <div className="user-nav-profile">
                <span className="welcome-text">Welcome, {user.name}</span>
                <button className="btn btn-secondary logout-btn" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            ) : (
              <button className="btn btn-primary signin-btn" onClick={() => { setIsRegisterMode(false); setAuthModalOpen(true); setMobileMenuOpen(false); }}>
                Sign In
              </button>
            )}
          </div>
        </nav>
        {mobileMenuOpen && (
          <div className="mobile-menu-backdrop" onClick={() => setMobileMenuOpen(false)}></div>
        )}
      </header>

      {/* Main Pages */}
      <main className="content-wrapper">
        {renderPage()}
      </main>

      {/* Shared Footer */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} CyberGuard Awareness & Education Hub. Powered by Cybersecurity Training Initiative.</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Secure Sandbox Envrionment v1.2</p>
      </footer>

      {/* Authentication Modal */}
      {authModalOpen && (
        <div className="modal-backdrop" onClick={() => setAuthModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <button 
              className="btn btn-secondary btn-icon" 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none' }}
              onClick={() => setAuthModalOpen(false)}
            >
              <X size={18} />
            </button>

            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
              {isRegisterMode ? "Create Account" : "Access Portal"}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {isRegisterMode ? "Sign up to track workshop progression and download certificates" : "Sign in with your registered credentials"}
            </p>

            <form onSubmit={handleAuthSubmit}>
              {isRegisterMode && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    placeholder="Enter your name" 
                    required 
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  placeholder="name@organization.com" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  placeholder="Min 8 characters, capital, digit, symbol" 
                  required 
                />
              </div>

              {isRegisterMode && (
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={authForm.confirmPassword}
                    onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                    placeholder="Repeat password" 
                    required 
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                {isRegisterMode ? "Register Account" : "Authenticate Session"}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.88rem' }}>
                {isRegisterMode ? (
                  <p>Already have an account? <button type="button" style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: '500', padding: 0, font: 'inherit' }} onClick={() => setIsRegisterMode(false)}>Sign In</button></p>
                ) : (
                  <p>Need access? <button type="button" style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: '500', padding: 0, font: 'inherit' }} onClick={() => setIsRegisterMode(true)}>Register here</button></p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' && <CheckCircle size={18} style={{ color: 'var(--success)' }} />}
            {t.type === 'error' && <Shield size={18} style={{ color: 'var(--danger)' }} />}
            {t.type === 'warning' && <Info size={18} style={{ color: 'var(--warning)' }} />}
            {t.type === 'info' && <Info size={18} style={{ color: 'var(--accent-blue)' }} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
