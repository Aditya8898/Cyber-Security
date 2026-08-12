import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2, Database, BookOpen, AlertTriangle, FileText, CheckSquare, Upload, HelpCircle, Activity, Pin, MessageSquare } from 'lucide-react';
import { api } from '../utils/api';

export default function AdminPanel({ addToast }) {
  const [adminTab, setAdminTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Content state caches
  const [articles, setArticles] = useState([]);
  const [news, setNews] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [modules, setModules] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Selected targets for sub-management
  const [selectedWorkshopId, setSelectedWorkshopId] = useState('');

  // Form display toggles
  const [activeForm, setActiveForm] = useState(null); // 'article' | 'news' | 'workshop' | 'module' | 'quiz'
  const [editId, setEditId] = useState(null);

  // Upload helpers
  const [uploading, setUploading] = useState(false);

  // Forms state
  const [articleForm, setArticleForm] = useState({ title: '', shortDescription: '', content: '', category: 'General', coverImage: '', author: 'Admin' });
  const [newsForm, setNewsForm] = useState({ title: '', shortDescription: '', content: '', coverImage: '', source: 'CyberGuard Threat Desk' });
  const [workshopForm, setWorkshopForm] = useState({ title: '', shortDescription: '', description: '', thumbnail: '', instructor: 'CEP Team', duration: '2 Hours', level: 'Beginner' });
  const [moduleForm, setModuleForm] = useState({ workshop: '', title: '', description: '', theory: '', videoUrl: '', pdfUrl: '', order: 1, duration: '15 Minutes' });
  const [quizForm, setQuizForm] = useState({ workshop: '', question: '', options: ['', ''], correctAnswer: 0, marks: 1 });

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      if (res.success && res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      addToast(err.message || "Failed to load admin stats", 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const fetchAllCommunityPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await api.get('/blogs');
      if (res.success && res.data) {
        setCommunityPosts(res.data);
      }
    } catch (err) {
      addToast(err.message || "Failed to load community posts", 'error');
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (adminTab === 'community') {
      fetchAllCommunityPosts();
    }
  }, [adminTab]);

  const handlePinPost = async (postId) => {
    try {
      const res = await api.patch(`/blogs/${postId}/pin`);
      if (res.success) {
        addToast("Post pinned successfully", "success");
        fetchAllCommunityPosts();
      }
    } catch (err) {
      addToast(err.message || "Failed to pin post", "error");
    }
  };

  const handleUnpinPost = async (postId) => {
    try {
      const res = await api.patch(`/blogs/${postId}/unpin`);
      if (res.success) {
        addToast("Post unpinned successfully", "success");
        fetchAllCommunityPosts();
      }
    } catch (err) {
      addToast(err.message || "Failed to unpin post", "error");
    }
  };

  const handleDeleteCommunityPost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this community post? This will permanently remove it along with all likes and comments.")) return;
    try {
      const res = await api.delete(`/blogs/admin/${postId}`);
      if (res.success) {
        addToast("Community post deleted successfully", "success");
        setCommunityPosts(prev => prev.filter(p => p._id !== postId));
      }
    } catch (err) {
      addToast(err.message || "Failed to delete post", "error");
    }
  };

  // Fetch collections depending on tab
  useEffect(() => {
    const fetchTabCollections = async () => {
      try {
        if (adminTab === 'articles') {
          const res = await api.get('/articles');
          if (res.success) setArticles(res.data);
        } else if (adminTab === 'news') {
          const res = await api.get('/news');
          if (res.success) setNews(res.data);
        } else if (adminTab === 'workshops') {
          const res = await api.get('/workshops');
          if (res.success) setWorkshops(res.data);
        } else if (adminTab === 'modules') {
          const res = await api.get('/workshops');
          if (res.success) {
            setWorkshops(res.data);
            if (res.data.length > 0 && !selectedWorkshopId) {
              setSelectedWorkshopId(res.data[0]._id);
            }
          }
        } else if (adminTab === 'quizzes') {
          const res = await api.get('/workshops');
          if (res.success) {
            setWorkshops(res.data);
            if (res.data.length > 0 && !selectedWorkshopId) {
              setSelectedWorkshopId(res.data[0]._id);
            }
          }
        }
      } catch (err) {
        addToast("Error fetching management lists", 'error');
      }
    };
    fetchTabCollections();
  }, [adminTab, selectedWorkshopId]);

  // Load modules when selectedWorkshopId changes
  useEffect(() => {
    if (adminTab === 'modules' && selectedWorkshopId) {
      const fetchModules = async () => {
        try {
          const res = await api.get(`/modules/workshop/${selectedWorkshopId}`);
          if (res.success) {
            setModules(res.data.sort((a, b) => a.order - b.order));
          }
        } catch (e) {
          setModules([]);
        }
      };
      fetchModules();
    } else if (adminTab === 'quizzes' && selectedWorkshopId) {
      const fetchQuizzes = async () => {
        try {
          const res = await api.get(`/quiz/workshop/${selectedWorkshopId}`);
          if (res.success) {
            setQuizzes(res.data);
          }
        } catch (e) {
          setQuizzes([]);
        }
      };
      fetchQuizzes();
    }
  }, [selectedWorkshopId, adminTab]);

  // Handle generic file upload using /api/upload
  const handleFileUpload = async (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await api.post('/upload', formData, true);
      if (res.success && res.path) {
        callback(res.path);
        addToast("File uploaded successfully!", "success");
      }
    } catch (err) {
      addToast(err.message || "File upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  // Create or Update CRUD functions
  const handleArticleSubmit = async (e) => {
    e.preventDefault();
    try {
      const slug = articleForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const payload = { ...articleForm, slug };

      let res;
      if (editId) {
        res = await api.put(`/articles/${editId}`, payload);
        addToast("Article updated successfully", "success");
      } else {
        res = await api.post('/articles', payload);
        addToast("Article created successfully", "success");
      }

      if (res.success) {
        setActiveForm(null);
        setEditId(null);
        setArticleForm({ title: '', shortDescription: '', content: '', category: 'General', coverImage: '', author: 'Admin' });
        // Reload list
        const listRes = await api.get('/articles');
        if (listRes.success) setArticles(listRes.data);
      }
    } catch (err) {
      addToast(err.message || "Failed to save article", "error");
    }
  };

  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    try {
      const slug = newsForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const payload = { ...newsForm, slug };

      let res;
      if (editId) {
        res = await api.put(`/news/${editId}`, payload);
        addToast("Alert updated successfully", "success");
      } else {
        res = await api.post('/news', payload);
        addToast("Alert created successfully", "success");
      }

      if (res.success) {
        setActiveForm(null);
        setEditId(null);
        setNewsForm({ title: '', shortDescription: '', content: '', coverImage: '', source: 'CyberGuard Threat Desk' });
        const listRes = await api.get('/news');
        if (listRes.success) setNews(listRes.data);
      }
    } catch (err) {
      addToast(err.message || "Failed to save alert", "error");
    }
  };

  const handleWorkshopSubmit = async (e) => {
    e.preventDefault();
    try {
      const slug = workshopForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const payload = { ...workshopForm, slug };

      let res;
      if (editId) {
        res = await api.put(`/workshops/${editId}`, payload);
        addToast("Workshop updated successfully", "success");
      } else {
        res = await api.post('/workshops', payload);
        addToast("Workshop created successfully", "success");
      }

      if (res.success) {
        setActiveForm(null);
        setEditId(null);
        setWorkshopForm({ title: '', shortDescription: '', description: '', thumbnail: '', instructor: 'CEP Team', duration: '2 Hours', level: 'Beginner' });
        const listRes = await api.get('/workshops');
        if (listRes.success) setWorkshops(listRes.data);
      }
    } catch (err) {
      addToast(err.message || "Failed to save workshop", "error");
    }
  };

  const handleModuleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...moduleForm, workshop: selectedWorkshopId };
      let res;
      if (editId) {
        res = await api.put(`/modules/${editId}`, payload);
        addToast("Module updated successfully", "success");
      } else {
        res = await api.post('/modules', payload);
        addToast("Module created successfully", "success");
      }

      if (res.success) {
        setActiveForm(null);
        setEditId(null);
        setModuleForm({ workshop: '', title: '', description: '', theory: '', videoUrl: '', pdfUrl: '', order: modules.length + 1, duration: '15 Minutes' });
        const listRes = await api.get(`/modules/workshop/${selectedWorkshopId}`);
        if (listRes.success) setModules(listRes.data.sort((a, b) => a.order - b.order));
      }
    } catch (err) {
      addToast(err.message || "Failed to save module", "error");
    }
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...quizForm, workshop: selectedWorkshopId };
      let res;
      if (editId) {
        res = await api.put(`/quiz/${editId}`, payload);
        addToast("Quiz question updated successfully", "success");
      } else {
        res = await api.post('/quiz', payload);
        addToast("Quiz question added successfully", "success");
      }
      if (res.success) {
        setActiveForm(null);
        setEditId(null);
        setQuizForm({ workshop: '', question: '', options: ['', ''], correctAnswer: 0, marks: 1 });
        const listRes = await api.get(`/quiz/workshop/${selectedWorkshopId}`);
        if (listRes.success) setQuizzes(listRes.data);
      }
    } catch (err) {
      addToast(err.message || "Failed to save quiz question", "error");
    }
  };

  // Delete handlers
  const deleteItem = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      let endpoint = '';
      if (type === 'article') endpoint = `/articles/${id}`;
      else if (type === 'news') endpoint = `/news/${id}`;
      else if (type === 'workshop') endpoint = `/workshops/${id}`;
      else if (type === 'module') endpoint = `/modules/${id}`;
      else if (type === 'quiz') endpoint = `/quiz/${id}`;

      const res = await api.delete(endpoint);
      if (res.success) {
        addToast("Deleted successfully", "success");
        // Reload list
        if (type === 'article') {
          setArticles(prev => prev.filter(x => x._id !== id));
        } else if (type === 'news') {
          setNews(prev => prev.filter(x => x._id !== id));
        } else if (type === 'workshop') {
          setWorkshops(prev => prev.filter(x => x._id !== id));
        } else if (type === 'module') {
          setModules(prev => prev.filter(x => x._id !== id));
        } else if (type === 'quiz') {
          setQuizzes(prev => prev.filter(x => x._id !== id));
        }
      }
    } catch (err) {
      addToast(err.message || "Deletion failed", "error");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Shield size={36} style={{ color: 'var(--accent-cyan)' }} />
        <div>
          <h1 style={{ fontSize: '2.5rem' }}>Administrative Control Console</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Publish articles, launch live threat warnings, design syllabus courses, and orchestrate final workshop quizzes.</p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        {[
          { key: 'overview', lbl: 'Overview', icon: <Activity size={16} /> },
          { key: 'articles', lbl: 'Manage Articles', icon: <FileText size={16} /> },
          { key: 'news', lbl: 'Manage News/Alerts', icon: <AlertTriangle size={16} /> },
          { key: 'workshops', lbl: 'Manage Workshops', icon: <BookOpen size={16} /> },
          { key: 'modules', lbl: 'Manage Syllabus', icon: <Database size={16} /> },
          { key: 'quizzes', lbl: 'Manage Quizzes', icon: <CheckSquare size={16} /> },
          { key: 'community', lbl: 'Manage Community', icon: <MessageSquare size={16} /> },
        ].map(item => (
          <button 
            key={item.key}
            className={`filter-btn ${adminTab === item.key ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => {
              setAdminTab(item.key);
              setActiveForm(null);
              setEditId(null);
            }}
          >
            {item.icon} {item.lbl}
          </button>
        ))}
      </div>

      {/* Admin Views */}
      {adminTab === 'overview' && (
        <div>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading overview...</p>
          ) : dashboardData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {/* Counters */}
              <div className="dashboard-stats" style={{ marginTop: '0' }}>
                <div className="glass-panel stat-item">
                  <div className="stat-val">{dashboardData.totalUsers}</div>
                  <div className="stat-lbl">Learners Registered</div>
                </div>
                <div className="glass-panel stat-item">
                  <div className="stat-val">{dashboardData.totalWorkshops}</div>
                  <div className="stat-lbl">Workshops Installed</div>
                </div>
                <div className="glass-panel stat-item">
                  <div className="stat-val">{dashboardData.totalArticles}</div>
                  <div className="stat-lbl">Guides Written</div>
                </div>
                <div className="glass-panel stat-item">
                  <div className="stat-val">{dashboardData.totalCertificates}</div>
                  <div className="stat-lbl">Credentials Awarded</div>
                </div>
              </div>

              {/* Grid lists: Recent Users & Enrollments */}
              <div className="grid-cols-2" style={{ marginTop: '0' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h3 style={{ marginBottom: '1rem', borderLeft: '3px solid var(--accent-cyan)', paddingLeft: '0.5rem' }}>Recent Learner Signups</h3>
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.recentUsers?.map(u => (
                          <tr key={u._id}>
                            <td data-label="Name">{u.name}</td>
                            <td data-label="Email">{u.email}</td>
                            <td data-label="Role"><span className="tag" style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}>{u.role}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h3 style={{ marginBottom: '1rem', borderLeft: '3px solid var(--accent-cyan)', paddingLeft: '0.5rem' }}>Recent Enrolls</h3>
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Workshop Path</th>
                          <th>Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.recentEnrollments?.map(e => (
                          <tr key={e._id}>
                            <td data-label="User">{e.user?.name}</td>
                            <td data-label="Workshop Path">{e.workshop?.title || 'Unknown'}</td>
                            <td data-label="Progress">{e.progress}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p>Failed to retrieve metrics.</p>
          )}
        </div>
      )}

      {/* Articles Tab */}
      {adminTab === 'articles' && (
        <div>
          <div className="admin-section-header">
            <h2>Knowledge Articles</h2>
            <button className="btn btn-primary" onClick={() => { setActiveForm('article'); setEditId(null); }}>
              <Plus size={16} /> New Article
            </button>
          </div>

          {activeForm === 'article' && (
            <form onSubmit={handleArticleSubmit} className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <h3>{editId ? "Update Article" : "Create New Knowledge Article"}</h3>
              
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Article Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={articleForm.title} 
                  onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Short Description / Catchphrase</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={articleForm.shortDescription} 
                  onChange={(e) => setArticleForm({ ...articleForm, shortDescription: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Article Category</label>
                <select 
                  className="form-control" 
                  value={articleForm.category}
                  onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                >
                  <option value="Phishing">Phishing</option>
                  <option value="UPI Fraud">UPI Fraud</option>
                  <option value="OTP Scam">OTP Scam</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Password Security">Password Security</option>
                  <option value="Ransomware">Ransomware</option>
                  <option value="AI Scam">AI Scam</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Cover Image (Upload file)</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    onChange={(e) => handleFileUpload(e, (path) => setArticleForm({ ...articleForm, coverImage: path }))} 
                  />
                  {articleForm.coverImage && <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Path: {articleForm.coverImage}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Article Markdown / Content</label>
                <textarea 
                  rows="8" 
                  className="form-control" 
                  value={articleForm.content} 
                  onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">Save Document</button>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveForm(null)}>Cancel</button>
              </div>
            </form>
          )}

          <div className="data-table-container glass-panel">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map(art => (
                  <tr key={art._id}>
                    <td data-label="Title">{art.title}</td>
                    <td data-label="Category"><span className="tag">{art.category}</span></td>
                    <td data-label="Author">{art.author}</td>
                    <td data-label="Actions">
                      <div className="action-links">
                        <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => {
                          setEditId(art._id);
                          setArticleForm({ title: art.title, shortDescription: art.shortDescription, content: art.content, category: art.category, coverImage: art.coverImage, author: art.author });
                          setActiveForm('article');
                        }}><Edit size={14} /></button>
                        <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger)' }} onClick={() => deleteItem('article', art._id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* News Tab */}
      {adminTab === 'news' && (
        <div>
          <div className="admin-section-header">
            <h2>Scam Alerts & Warnings</h2>
            <button className="btn btn-primary" onClick={() => { setActiveForm('news'); setEditId(null); }}>
              <Plus size={16} /> New Alert Warning
            </button>
          </div>

          {activeForm === 'news' && (
            <form onSubmit={handleNewsSubmit} className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <h3>{editId ? "Update Scam Alert" : "Deploy Live Threat Warning"}</h3>
              
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Alert Header / Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newsForm.title} 
                  onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Short Warning Description</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newsForm.shortDescription} 
                  onChange={(e) => setNewsForm({ ...newsForm, shortDescription: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Source Info (e.g. CERT-In, CyberGuard Network)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newsForm.source} 
                  onChange={(e) => setNewsForm({ ...newsForm, source: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alert Banner Image</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    onChange={(e) => handleFileUpload(e, (path) => setNewsForm({ ...newsForm, coverImage: path }))} 
                  />
                  {newsForm.coverImage && <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Path: {newsForm.coverImage}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Threat Assessment</label>
                <textarea 
                  rows="6" 
                  className="form-control" 
                  value={newsForm.content} 
                  onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">Deploy Warning</button>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveForm(null)}>Cancel</button>
              </div>
            </form>
          )}

          <div className="data-table-container glass-panel">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Alert Title</th>
                  <th>Source Channel</th>
                  <th>Logged On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {news.map(item => (
                  <tr key={item._id}>
                    <td data-label="Alert Title">{item.title}</td>
                    <td data-label="Source Channel">{item.source}</td>
                    <td data-label="Logged On">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td data-label="Actions">
                      <div className="action-links">
                        <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => {
                          setEditId(item._id);
                          setNewsForm({ title: item.title, shortDescription: item.shortDescription, content: item.content, coverImage: item.coverImage, source: item.source });
                          setActiveForm('news');
                        }}><Edit size={14} /></button>
                        <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger)' }} onClick={() => deleteItem('news', item._id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Workshops Tab */}
      {adminTab === 'workshops' && (
        <div>
          <div className="admin-section-header">
            <h2>Syllabus Workshops</h2>
            <button className="btn btn-primary" onClick={() => { setActiveForm('workshop'); setEditId(null); }}>
              <Plus size={16} /> New Workshop
            </button>
          </div>

          {activeForm === 'workshop' && (
            <form onSubmit={handleWorkshopSubmit} className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <h3>{editId ? "Update Workshop Details" : "Construct Training Path / Workshop"}</h3>
              
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Workshop Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={workshopForm.title} 
                  onChange={(e) => setWorkshopForm({ ...workshopForm, title: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Short Description</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={workshopForm.shortDescription} 
                  onChange={(e) => setWorkshopForm({ ...workshopForm, shortDescription: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Curriculum Summary</label>
                <textarea 
                  rows="5" 
                  className="form-control" 
                  value={workshopForm.description} 
                  onChange={(e) => setWorkshopForm({ ...workshopForm, description: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Difficulty Level</label>
                <select 
                  className="form-control" 
                  value={workshopForm.level}
                  onChange={(e) => setWorkshopForm({ ...workshopForm, level: e.target.value })}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Duration (e.g. 90 Minutes, 3 Hours)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={workshopForm.duration} 
                  onChange={(e) => setWorkshopForm({ ...workshopForm, duration: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Instructor Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={workshopForm.instructor} 
                  onChange={(e) => setWorkshopForm({ ...workshopForm, instructor: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Workshop Thumbnail Image</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    onChange={(e) => handleFileUpload(e, (path) => setWorkshopForm({ ...workshopForm, thumbnail: path }))} 
                  />
                  {workshopForm.thumbnail && <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Path: {workshopForm.thumbnail}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">Save Course</button>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveForm(null)}>Cancel</button>
              </div>
            </form>
          )}

          <div className="data-table-container glass-panel">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Workshop Title</th>
                  <th>Level</th>
                  <th>Duration</th>
                  <th>Instructor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workshops.map(ws => (
                  <tr key={ws._id}>
                    <td data-label="Workshop Title">{ws.title}</td>
                    <td data-label="Level"><span className="tag">{ws.level}</span></td>
                    <td data-label="Duration">{ws.duration}</td>
                    <td data-label="Instructor">{ws.instructor}</td>
                    <td data-label="Actions">
                      <div className="action-links">
                        <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => {
                          setEditId(ws._id);
                          setWorkshopForm({ title: ws.title, shortDescription: ws.shortDescription, description: ws.description, thumbnail: ws.thumbnail, instructor: ws.instructor, duration: ws.duration, level: ws.level });
                          setActiveForm('workshop');
                        }}><Edit size={14} /></button>
                        <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger)' }} onClick={() => deleteItem('workshop', ws._id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modules Tab */}
      {adminTab === 'modules' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2>Syllabus Lessons</h2>
              <select 
                className="form-control" 
                style={{ width: '220px' }}
                value={selectedWorkshopId}
                onChange={(e) => setSelectedWorkshopId(e.target.value)}
              >
                {workshops.map(w => (
                  <option key={w._id} value={w._id}>{w.title}</option>
                ))}
              </select>
            </div>
            {selectedWorkshopId && (
              <button className="btn btn-primary" onClick={() => { setActiveForm('module'); setEditId(null); setModuleForm({ ...moduleForm, order: modules.length + 1 })} }>
                <Plus size={16} /> Add New Lesson
              </button>
            )}
          </div>

          {activeForm === 'module' && (
            <form onSubmit={handleModuleSubmit} className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <h3>{editId ? "Update Lesson Details" : "Insert Syllabus Lesson Module"}</h3>
              
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Lesson Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={moduleForm.title} 
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Short Objective Description</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={moduleForm.description} 
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Order Index (Sequence priority)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={moduleForm.order} 
                  onChange={(e) => setModuleForm({ ...moduleForm, order: Number(e.target.value) })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Video Embed Lecture Link</label>
                <input 
                  type="url" 
                  className="form-control" 
                  placeholder="https://youtube.com/embed/..."
                  value={moduleForm.videoUrl} 
                  onChange={(e) => setModuleForm({ ...moduleForm, videoUrl: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Lesson Handout Document (PDF Upload)</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={(e) => handleFileUpload(e, (path) => setModuleForm({ ...moduleForm, pdfUrl: path }))} 
                  />
                  {moduleForm.pdfUrl && <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Path: {moduleForm.pdfUrl}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Lesson Theory Content / Body Text</label>
                <textarea 
                  rows="8" 
                  className="form-control" 
                  value={moduleForm.theory} 
                  onChange={(e) => setModuleForm({ ...moduleForm, theory: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">Save Lesson</button>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveForm(null)}>Cancel</button>
              </div>
            </form>
          )}

          <div className="data-table-container glass-panel">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Lesson Title</th>
                  <th>Objective</th>
                  <th>Has Handout</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {modules.map(mod => (
                  <tr key={mod._id}>
                    <td data-label="Order">{mod.order}</td>
                    <td data-label="Lesson Title">{mod.title}</td>
                    <td data-label="Objective">{mod.description}</td>
                    <td data-label="Has Handout">{mod.pdfUrl ? "Yes (PDF)" : "No"}</td>
                    <td data-label="Actions">
                      <div className="action-links">
                        <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => {
                          setEditId(mod._id);
                          setModuleForm({ workshop: mod.workshop, title: mod.title, description: mod.description, theory: mod.theory, videoUrl: mod.videoUrl, pdfUrl: mod.pdfUrl, order: mod.order, duration: mod.duration });
                          setActiveForm('module');
                        }}><Edit size={14} /></button>
                        <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger)' }} onClick={() => deleteItem('module', mod._id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {modules.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No modules added to this workshop curriculum.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quizzes Tab */}
      {adminTab === 'quizzes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2>Assessment Quizzes</h2>
              <select 
                className="form-control" 
                style={{ width: '220px' }}
                value={selectedWorkshopId}
                onChange={(e) => setSelectedWorkshopId(e.target.value)}
              >
                {workshops.map(w => (
                  <option key={w._id} value={w._id}>{w.title}</option>
                ))}
              </select>
            </div>
            {selectedWorkshopId && (
              <button className="btn btn-primary" onClick={() => { setActiveForm('quiz'); setEditId(null); setQuizForm({ workshop: selectedWorkshopId, question: '', options: ['', ''], correctAnswer: 0, marks: 1 }); }}>
                <Plus size={16} /> New Quiz Question
              </button>
            )}
          </div>

          {activeForm === 'quiz' && (
            <form onSubmit={handleQuizSubmit} className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <h3>{editId ? "Update Assessment Question" : "Add Assessment Question"}</h3>
              
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Question Text</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={quizForm.question} 
                  onChange={(e) => setQuizForm({ ...quizForm, question: e.target.value })} 
                  required 
                />
              </div>

              {quizForm.options.map((option, idx) => (
                <div className="form-group" key={idx}>
                  <label className="form-label">Option {String.fromCharCode(65 + idx)}</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={option} 
                      onChange={(e) => {
                        const updatedOptions = [...quizForm.options];
                        updatedOptions[idx] = e.target.value;
                        setQuizForm({ ...quizForm, options: updatedOptions });
                      }} 
                      required 
                    />
                    {quizForm.options.length > 2 && (
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ color: 'var(--danger)' }}
                        onClick={() => {
                          const updatedOptions = quizForm.options.filter((_, i) => i !== idx);
                          setQuizForm({ ...quizForm, options: updatedOptions });
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ marginBottom: '1.25rem' }}
                onClick={() => setQuizForm({ ...quizForm, options: [...quizForm.options, ''] })}
              >
                Add Option Slot
              </button>

              <div className="form-group">
                <label className="form-label">Correct Option Index (A = 0, B = 1, etc.)</label>
                <select 
                  className="form-control"
                  value={quizForm.correctAnswer}
                  onChange={(e) => setQuizForm({ ...quizForm, correctAnswer: Number(e.target.value) })}
                >
                  {quizForm.options.map((_, idx) => (
                    <option key={idx} value={idx}>Option {String.fromCharCode(65 + idx)}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Marks Value</label>
                <input 
                  type="number" 
                  className="form-control" 
                  min="1" 
                  value={quizForm.marks} 
                  onChange={(e) => setQuizForm({ ...quizForm, marks: Number(e.target.value) })} 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">Save Question</button>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveForm(null)}>Cancel</button>
              </div>
            </form>
          )}

          <div className="data-table-container glass-panel">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Question Content</th>
                  <th>Options count</th>
                  <th>Correct Index</th>
                  <th>Marks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map(q => (
                  <tr key={q._id}>
                    <td data-label="Question Content">{q.question}</td>
                    <td data-label="Options count">{q.options?.length} Slots</td>
                    <td data-label="Correct Index">Option {String.fromCharCode(65 + q.correctAnswer)}</td>
                    <td data-label="Marks">{q.marks || 1} Pts</td>
                    <td data-label="Actions">
                      <div className="action-links">
                        <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => {
                          setEditId(q._id);
                          setQuizForm({ workshop: q.workshop, question: q.question, options: q.options, correctAnswer: q.correctAnswer, marks: q.marks || 1 });
                          setActiveForm('quiz');
                        }}><Edit size={14} /></button>
                        <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger)' }} onClick={() => deleteItem('quiz', q._id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {quizzes.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No quiz questions mapped to this workshop assessment path.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Community Management Tab */}
      {adminTab === 'community' && (
        <div>
          <div className="admin-section-header">
            <h2>Community Post Moderation</h2>
          </div>

          {postsLoading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading community postings...</p>
          ) : (
            <div className="data-table-container glass-panel">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Post Title</th>
                    <th>Author</th>
                    <th>Mentioned Workshop</th>
                    <th>Likes</th>
                    <th>Comments</th>
                    <th>Pinned</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {communityPosts.map(post => (
                    <tr key={post._id}>
                      <td data-label="Post Title">{post.title}</td>
                      <td data-label="Author">{post.author?.name || 'Anonymous'}</td>
                      <td data-label="Mentioned Workshop">
                        {post.mentionedWorkshop ? (
                          <span style={{ color: 'var(--accent-cyan)' }}>
                            {post.mentionedWorkshop.title}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>None</span>
                        )}
                      </td>
                      <td data-label="Likes">{post.likesCount || 0}</td>
                      <td data-label="Comments">{post.commentsCount || 0}</td>
                      <td data-label="Pinned">{post.isPinned ? "Yes" : "No"}</td>
                      <td data-label="Actions">
                        <div className="action-links">
                          {post.isPinned ? (
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.4rem', color: 'var(--warning)' }} 
                              onClick={() => handleUnpinPost(post._id)}
                              title="Unpin Post"
                            >
                              <Pin size={14} fill="var(--warning)" />
                            </button>
                          ) : (
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.4rem' }} 
                              onClick={() => handlePinPost(post._id)}
                              title="Pin Post"
                            >
                              <Pin size={14} />
                            </button>
                          )}
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem', color: 'var(--danger)' }} 
                            onClick={() => handleDeleteCommunityPost(post._id)}
                            title="Delete Post"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {communityPosts.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No community posts have been published yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
