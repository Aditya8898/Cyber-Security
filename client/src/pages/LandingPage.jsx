import React, { useEffect, useState } from 'react';
import { Shield, BookOpen, AlertTriangle, Play, Award, ArrowRight } from 'lucide-react';
import { api } from '../utils/api';

export default function LandingPage({ setPage, setSelectedWorkshopId, setSelectedArticleId, addToast }) {
  const [stats, setStats] = useState({
    users: 1420,
    articles: 18,
    alerts: 12,
    certificates: 312
  });
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [threatAlerts, setThreatAlerts] = useState([]);

  useEffect(() => {
    // Load some featured articles & news
    const loadData = async () => {
      try {
        const articlesRes = await api.get('/articles');
        if (articlesRes.success && articlesRes.data) {
          setFeaturedArticles(articlesRes.data.slice(0, 3));
        }
        const newsRes = await api.get('/news');
        if (newsRes.success && newsRes.data) {
          setThreatAlerts(newsRes.data.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to load landing page data", err);
      }
    };
    loadData();
  }, []);

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero-section glass-panel">
        <span className="hero-subtitle">Interactive Cyber Defense Training</span>
        <h1 className="hero-title">Empower Yourself Against Modern Cyber Threats</h1>
        <p className="hero-text">
          Learn to identify phishing attempts, secure your digital payments, prevent OTP scams, and earn verified certificate credentials with our custom bite-sized training workshops.
        </p>
        <div className="hero-cta">
          <button className="btn btn-primary" onClick={() => setPage('workshops')}>
            Start Training Portal <ArrowRight size={16} />
          </button>
          <button className="btn btn-secondary" onClick={() => setPage('articles')}>
            Explore Knowledge Hub
          </button>
        </div>

        {/* Dynamic / Static Stats */}
        <div className="dashboard-stats">
          <div className="stat-item glass-panel">
            <div className="stat-val">{stats.users}+</div>
            <div className="stat-lbl">Active Learners</div>
          </div>
          <div className="stat-item glass-panel">
            <div className="stat-val">{stats.articles}</div>
            <div className="stat-lbl">Training Guides</div>
          </div>
          <div className="stat-item glass-panel">
            <div className="stat-val">{stats.alerts}</div>
            <div className="stat-lbl">Active Scam Alerts</div>
          </div>
          <div className="stat-item glass-panel">
            <div className="stat-val">{stats.certificates}</div>
            <div className="stat-lbl">Certificates Issued</div>
          </div>
        </div>
      </section>

      {/* Grid: Featured Courses & Live Alerts */}
      <div className="grid-cols-2" style={{ marginTop: '3rem' }}>
        {/* Knowledge Pillar */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div className="btn-icon btn-primary" style={{ display: 'inline-flex', padding: '0.5rem' }}>
              <BookOpen size={20} style={{ color: '#080c14' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem' }}>Security Education guides</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Browse through our step-by-step walkthroughs of common fraud tactics used by cybercriminals.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {featuredArticles.length > 0 ? (
              featuredArticles.map(article => (
                <div 
                  key={article._id}
                  className="glass-panel" 
                  style={{ padding: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => {
                    setSelectedArticleId(article._id);
                    setPage('articles');
                  }}
                >
                  <div>
                    <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{article.title}</h4>
                    <span className="tag" style={{ marginTop: '0.25rem', display: 'inline-block' }}>{article.category}</span>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--accent-cyan)' }} />
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No articles available right now.</p>
            )}
          </div>
          
          <button 
            className="btn btn-secondary" 
            style={{ marginTop: '1.5rem', width: '100%' }}
            onClick={() => setPage('articles')}
          >
            Browse All Guides
          </button>
        </div>

        {/* Threat Alerts Pillar */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div className="btn-icon" style={{ display: 'inline-flex', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.15)' }}>
              <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem' }}>Live Threat Alerts</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Stay updated with real-time scam logs, zero-day alerts, fake bank communications, and SMS phishing warnings.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {threatAlerts.length > 0 ? (
              threatAlerts.map(alert => (
                <div 
                  key={alert._id} 
                  className="glass-panel" 
                  style={{ padding: '1rem', borderLeft: '3px solid var(--danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setPage('news')}
                >
                  <div>
                    <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{alert.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Source: {alert.source || 'Admin Notification'}</span>
                  </div>
                  <Shield size={16} style={{ color: 'var(--danger)' }} />
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No threat alerts published today.</p>
            )}
          </div>

          <button 
            className="btn btn-secondary" 
            style={{ marginTop: '1.5rem', width: '100%', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            onClick={() => setPage('news')}
          >
            Inspect Scam Feeds
          </button>
        </div>
      </div>
    </div>
  );
}
