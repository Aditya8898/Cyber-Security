import React, { useState, useEffect } from 'react';
import { Search, BookOpen, User, Calendar, Tag, ArrowLeft } from 'lucide-react';
import { api } from '../utils/api';

const ARTICLE_CATEGORIES = [
  "All",
  "Phishing",
  "UPI Fraud",
  "OTP Scam",
  "Social Media",
  "Password Security",
  "Ransomware",
  "AI Scam",
  "General",
];

export default function Articles({ selectedArticleId, setSelectedArticleId, addToast }) {
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [currentArticle, setCurrentArticle] = useState(null);

  // Load articles
  const loadArticles = async () => {
    setLoading(true);
    try {
      let endpoint = '/articles';
      if (searchQuery.trim()) {
        endpoint = `/articles/search?q=${encodeURIComponent(searchQuery)}`;
      }
      const res = await api.get(endpoint);
      if (res.success && res.data) {
        setArticles(res.data);
      }
    } catch (err) {
      addToast(err.message || "Failed to load articles", 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [searchQuery]);

  // Load specific article when selectedArticleId changes
  useEffect(() => {
    if (selectedArticleId) {
      const fetchSingleArticle = async () => {
        try {
          const res = await api.get(`/articles/${selectedArticleId}`);
          if (res.success && res.data) {
            setCurrentArticle(res.data);
          }
        } catch (err) {
          addToast("Failed to load article detail", 'error');
        }
      };
      fetchSingleArticle();
    } else {
      setCurrentArticle(null);
    }
  }, [selectedArticleId]);

  // Filtered list
  const filteredArticles = articles.filter(art => {
    if (selectedCategory === 'All') return true;
    return art.category === selectedCategory;
  });

  if (currentArticle) {
    return (
      <div className="article-reader-container">
        {/* Main Article Body */}
        <article className="glass-panel reader-main">
          <button 
            className="btn btn-secondary" 
            style={{ marginBottom: '1.5rem' }} 
            onClick={() => setSelectedArticleId(null)}
          >
            <ArrowLeft size={16} /> Back to Guides
          </button>

          {currentArticle.coverImage && (
            <img 
              src={currentArticle.coverImage.startsWith('http') ? currentArticle.coverImage : `${window.location.origin}${currentArticle.coverImage}`} 
              alt={currentArticle.title} 
              className="article-cover" 
            />
          )}

          <div className="article-header">
            <span className="tag">{currentArticle.category}</span>
            <h1 style={{ fontSize: '2.25rem', marginTop: '0.75rem' }}>{currentArticle.title}</h1>
            
            <div className="article-meta">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <User size={14} /> By {currentArticle.author || 'Admin'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={14} /> {new Date(currentArticle.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="article-content">
            <p style={{ fontWeight: '500', fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
              {currentArticle.shortDescription}
            </p>
            {currentArticle.content.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </article>

        {/* Sidebar recommendations */}
        <aside className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 className="sidebar-heading">Related Topics</h3>
          <ul className="sidebar-list">
            {articles
              .filter(a => a._id !== currentArticle._id && (a.category === currentArticle.category || currentArticle.category === 'General'))
              .slice(0, 4)
              .map(related => (
                <li 
                  key={related._id} 
                  className="glass-panel sidebar-item"
                  onClick={() => setSelectedArticleId(related._id)}
                >
                  <h4>{related.title}</h4>
                  <span className="tag" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', marginTop: '0.25rem', display: 'inline-block' }}>
                    {related.category}
                  </span>
                </li>
              ))}
            {articles.filter(a => a._id !== currentArticle._id).length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No other guides in this category.</p>
            )}
          </ul>
        </aside>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Cybersecurity Awareness Guides</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Explore articles written by our digital defense professionals. Use filters to narrow down by categories of risk.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search security articles, fraud types, scams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ul className="category-filter-list">
        {ARTICLE_CATEGORIES.map(category => (
          <li key={category}>
            <button 
              className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          </li>
        ))}
      </ul>

      {/* Grid of Articles */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Searching directory...</div>
      ) : filteredArticles.length > 0 ? (
        <div className="grid-cols-3">
          {filteredArticles.map(article => (
            <div 
              key={article._id} 
              className="glass-panel card"
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedArticleId(article._id)}
            >
              <div>
                {article.coverImage && (
                  <img 
                    src={article.coverImage.startsWith('http') ? article.coverImage : `${window.location.origin}${article.coverImage}`} 
                    alt={article.title}
                    style={{ width: '100%', height: '160px', objectFit: 'contain', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }} 
                  />
                )}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="tag">{article.category}</span>
                </div>
                <h3 className="card-title">{article.title}</h3>
                <p className="card-desc">
                  {article.shortDescription.length > 100 
                    ? `${article.shortDescription.slice(0, 100)}...` 
                    : article.shortDescription}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>By {article.author || 'Admin'}</span>
                <span style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Read Guide <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No articles match your search or filter requirements.
        </div>
      )}
    </div>
  );
}
