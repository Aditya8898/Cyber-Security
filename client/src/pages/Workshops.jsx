import React, { useState, useEffect } from 'react';
import { Search, Award, Clock, ArrowRight, PlayCircle, BookOpen } from 'lucide-react';
import { api } from '../utils/api';

export default function Workshops({ user, setPage, setSelectedWorkshopId, addToast, setLoginModalOpen }) {
  const [workshops, setWorkshops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load workshops and user enrollments
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/workshops');
      if (res.success && res.data) {
        setWorkshops(res.data);
      }

      if (user) {
        const enrollRes = await api.get('/enrollments/my');
        if (enrollRes.success && enrollRes.data) {
          setEnrolledIds(enrollRes.data.map(e => e.workshop?._id));
        }
      }
    } catch (err) {
      addToast(err.message || "Failed to load workshops", 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle Enrollment
  const handleEnroll = async (workshopId) => {
    if (!user) {
      addToast("Please login or create an account to enroll.", "warning");
      setLoginModalOpen(true);
      return;
    }

    try {
      const res = await api.post('/enrollments', { workshop: workshopId });
      if (res.success) {
        addToast("Enrolled successfully! Redirecting to learning portal...", "success");
        setSelectedWorkshopId(workshopId);
        setPage('learning-portal');
      }
    } catch (err) {
      addToast(err.message || "Enrollment failed", "error");
    }
  };

  const filteredWorkshops = workshops.filter(ws => {
    const matchesSearch = ws.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ws.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'All' || ws.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Security Training Workshops</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Enroll in structured learning paths. Watch video lectures, read cybersecurity modules, complete quizzes, and claim your completion certificate.
        </p>
      </div>

      {/* Filter Options */}
      <div className="search-bar-container" style={{ marginBottom: '1.5rem' }}>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search security topics, techniques, levels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {['All', 'Beginner', 'Intermediate', 'Advanced'].map(lvl => (
          <button 
            key={lvl}
            className={`filter-btn ${selectedLevel === lvl ? 'active' : ''}`}
            onClick={() => setSelectedLevel(lvl)}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* Workshops Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading catalog...</div>
      ) : filteredWorkshops.length > 0 ? (
        <div className="grid-cols-3">
          {filteredWorkshops.map(ws => {
            const isEnrolled = enrolledIds.includes(ws._id);
            return (
              <div key={ws._id} className="glass-panel card">
                <div>
                  {ws.thumbnail ? (
                    <img 
                      src={ws.thumbnail.startsWith('http') ? ws.thumbnail : `${window.location.origin}${ws.thumbnail}`} 
                      alt={ws.title}
                      style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', border: '1px solid var(--border-color)' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '160px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={48} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="tag">{ws.level}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> {ws.duration || '2 Hours'}
                    </span>
                  </div>

                  <h3 className="card-title">{ws.title}</h3>
                  <p className="card-desc" style={{ fontSize: '0.88rem' }}>{ws.shortDescription}</p>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Instructor: {ws.instructor || 'CEP Team'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Award size={12} /> Verified Certificate
                    </span>
                  </div>

                  {isEnrolled ? (
                    <button 
                      className="btn btn-secondary" 
                      style={{ width: '100%', borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}
                      onClick={() => {
                        setSelectedWorkshopId(ws._id);
                        setPage('learning-portal');
                      }}
                    >
                      <PlayCircle size={16} /> Resume Portal
                    </button>
                  ) : (
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%' }}
                      onClick={() => handleEnroll(ws._id)}
                    >
                      Enroll Now <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No workshops currently published matching these requirements.
        </div>
      )}
    </div>
  );
}
