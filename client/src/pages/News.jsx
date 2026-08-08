import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, ShieldAlert, Clock, ArrowLeft, ExternalLink } from 'lucide-react';
import { api } from '../utils/api';

export default function News({ addToast }) {
  const [newsList, setNewsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);

  const loadNews = async () => {
    setLoading(true);
    try {
      let endpoint = '/news';
      if (searchQuery.trim()) {
        endpoint = `/news/search?q=${encodeURIComponent(searchQuery)}`;
      }
      const res = await api.get(endpoint);
      if (res.success && res.data) {
        setNewsList(res.data);
      }
    } catch (err) {
      addToast(err.message || "Failed to load scam news feed", 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, [searchQuery]);

  if (currentAlert) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <article className="glass-panel reader-main" style={{ padding: '2.5rem' }}>
          <button 
            className="btn btn-secondary" 
            style={{ marginBottom: '1.5rem' }} 
            onClick={() => setCurrentAlert(null)}
          >
            <ArrowLeft size={16} /> Back to Live Scam Alert Feed
          </button>

          {currentAlert.coverImage && (
            <img 
              src={currentAlert.coverImage.startsWith('http') ? currentAlert.coverImage : `${window.location.origin}${currentAlert.coverImage}`} 
              alt={currentAlert.title} 
              className="article-cover" 
            />
          )}

          <div className="article-header">
            <span className="tag" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              URGENT THREAT ALERT
            </span>
            <h1 style={{ fontSize: '2.25rem', marginTop: '0.75rem', color: 'var(--text-primary)' }}>{currentAlert.title}</h1>
            
            <div className="article-meta">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={14} /> Issued {new Date(currentAlert.createdAt).toLocaleString()}
              </span>
              {currentAlert.source && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ExternalLink size={14} /> Source: {currentAlert.source}
                </span>
              )}
            </div>
          </div>

          <div className="article-content">
            <p style={{ fontWeight: '600', fontSize: '1.15rem', color: 'var(--danger)', marginBottom: '1.5rem' }}>
              {currentAlert.shortDescription}
            </p>
            {currentAlert.content.split('\n').map((paragraph, index) => (
              <p key={index} style={{ marginBottom: '1rem' }}>{paragraph}</p>
            ))}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={36} style={{ color: 'var(--danger)' }} />
            Threat Alert Center
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Real-time tracking of active phishing campaigns, fake Android app packages, rogue payment links, and social engineering tricks.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search active scam threats, fraudulent links, SMS scams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Alert Feed Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Scanning global threat registry...</div>
      ) : newsList.length > 0 ? (
        <div className="grid-cols-2">
          {newsList.map(item => (
            <div 
              key={item._id} 
              className="glass-panel card" 
              style={{ borderLeft: '4px solid var(--danger)', cursor: 'pointer' }}
              onClick={() => setCurrentAlert(item)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Critical Alert
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} /> {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="card-title" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{item.title}</h3>
                <p className="card-desc" style={{ fontSize: '0.9rem' }}>{item.shortDescription}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Source: {item.source || 'Threat Intelligence'}</span>
                <span style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Read Threat Assessment <AlertTriangle size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No threat alerts match your search query.
        </div>
      )}
    </div>
  );
}
