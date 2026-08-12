import React, { useState, useEffect } from 'react';
import { BookOpen, Award, Settings, User, Key, Trash2, Shield, Calendar, Play, MessageSquare } from 'lucide-react';
import { api } from '../utils/api';

export default function Dashboard({ user, setUser, setPage, setSelectedWorkshopId, addToast }) {
  const [activeTab, setActiveTab] = useState('enrollments');
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Profile forms
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  
  // Password change forms
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const loadDashboardData = async () => {
    try {
      const enrollRes = await api.get('/enrollments/my');
      if (enrollRes.success && enrollRes.data) {
        setEnrollments(enrollRes.data);
      }

      const certRes = await api.get('/certificates/my');
      if (certRes.success && certRes.data) {
        setCertificates(certRes.data);
      }
    } catch (err) {
      addToast(err.message || "Failed to load dashboard records", 'error');
    }
  };

  const loadMyPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await api.get('/blogs/user/my-posts');
      if (res.success && res.data) {
        setMyPosts(res.data);
      }
    } catch (err) {
      addToast(err.message || "Failed to load community posts", 'error');
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (user && activeTab === 'community') {
      loadMyPosts();
    }
  }, [activeTab, user]);

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this community post? This action is permanent and will delete all comments and likes associated with it.")) return;
    try {
      const res = await api.delete(`/blogs/${postId}`);
      if (res.success) {
        addToast("Post deleted successfully", "success");
        setMyPosts(prev => prev.filter(p => p._id !== postId));
      }
    } catch (err) {
      addToast(err.message || "Failed to delete post", "error");
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Update Profile Name
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/user/profile', { name });
      if (res.success && res.data) {
        setUser(prev => ({ ...prev, name: res.data.name }));
        addToast("Profile updated successfully!", "success");
      }
    } catch (err) {
      addToast(err.message || "Failed to update profile", "error");
    }
  };

  // Change Password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast("New passwords do not match", "error");
      return;
    }

    try {
      const res = await api.put('/user/change-password', {
        oldPassword,
        newPassword
      });
      if (res.success) {
        addToast("Password changed successfully!", "success");
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      addToast(err.message || "Password change failed", "error");
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (window.confirm("WARNING: Are you absolutely sure you want to delete your account? This action is irreversible and all your course records, quiz scores, and certificate completions will be purged.")) {
      try {
        const res = await api.delete('/user/delete-account');
        if (res.success) {
          addToast("Account deleted successfully.", "info");
          localStorage.removeItem('cyber_token');
          setUser(null);
          setPage('landing');
        }
      } catch (err) {
        addToast(err.message || "Account deletion failed", "error");
      }
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Learner Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Review your enrolled classes, retrieve your security credentials, and keep your security configurations up to date.
        </p>
      </div>

      <div className="dashboard-grid">
        {/* Navigation Sidebar */}
        <aside className="glass-panel" style={{ padding: '1.5rem', alignSelf: 'start' }}>
          <div style={{ textItems: 'center', textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: '80px', height: '80px', background: 'var(--bg-tertiary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', border: '1px solid var(--border-color)' }}>
              <User size={40} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <h3>{user?.name}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email}</span>
            {user?.role === 'admin' && (
              <div style={{ marginTop: '0.5rem' }}>
                <span className="tag" style={{ background: 'rgba(0, 229, 255, 0.15)', color: 'var(--accent-cyan)', borderColor: 'rgba(0, 229, 255, 0.3)' }}>
                  PORTAL ADMIN
                </span>
              </div>
            )}
          </div>

          <nav className="tab-nav">
            <button 
              className={`tab-btn ${activeTab === 'enrollments' ? 'active' : ''}`}
              onClick={() => setActiveTab('enrollments')}
            >
              <BookOpen size={18} /> Enrolled Courses
            </button>
            <button 
              className={`tab-btn ${activeTab === 'certificates' ? 'active' : ''}`}
              onClick={() => setActiveTab('certificates')}
            >
              <Award size={18} /> Claimed Certificates
            </button>
            <button 
              className={`tab-btn ${activeTab === 'community' ? 'active' : ''}`}
              onClick={() => setActiveTab('community')}
            >
              <MessageSquare size={18} /> My Community Posts
            </button>
            <button 
              className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={18} /> Account Configurations
            </button>
          </nav>
        </aside>

        {/* Content Panel */}
        <section className="glass-panel" style={{ padding: '2rem' }}>
          {activeTab === 'enrollments' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>My Enrolled Workshops</h2>
              {enrollments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {enrollments.map(item => (
                    <div key={item._id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{item.workshop?.title}</h3>
                        <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                          <span>Level: {item.workshop?.level}</span>
                          <span>Completed: {item.completed ? "Yes" : "In Progress"}</span>
                        </div>

                        {/* Progress slider bar */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                            <span>Training Progress</span>
                            <span>{item.progress || 0}%</span>
                          </div>
                          <div className="progress-track-outer" style={{ height: '6px' }}>
                            <div className="progress-track-inner" style={{ width: `${item.progress || 0}%` }}></div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            setSelectedWorkshopId(item.workshop?._id);
                            setPage('learning-portal');
                          }}
                        >
                          <Play size={14} /> Resume Training
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  You have not enrolled in any security training workshops yet.
                  <button className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'block', margin: '1.5rem auto 0 auto' }} onClick={() => setPage('workshops')}>
                    View Workshop Catalog
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'certificates' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>My Verified Credentials</h2>
              {certificates.length > 0 ? (
                <div className="grid-cols-2" style={{ marginTop: '0' }}>
                  {certificates.map(cert => (
                    <div key={cert._id} className="glass-panel card" style={{ padding: '1.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', marginBottom: '0.5rem' }}>
                          <Award size={20} />
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Verified Certificate</span>
                        </div>
                        <h3 className="card-title" style={{ fontSize: '1.15rem' }}>{cert.workshop?.title}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                          ID: {cert.certificateId}
                        </p>
                      </div>
                      
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={12} /> Issued {new Date(cert.issuedDate).toLocaleDateString()}
                        </span>
                        
                        <button 
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => window.open(`${window.location.origin}${cert.pdfUrl}`, '_blank')}
                        >
                          View PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  You have not unlocked any certificates yet. Complete all lessons of a workshop and score 60%+ on the final assessment to claim.
                </div>
              )}
            </div>
          )}

          {activeTab === 'community' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>My Community Posts</h2>
              {postsLoading ? (
                <p style={{ color: 'var(--text-muted)' }}>Loading posts...</p>
              ) : myPosts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {myPosts.map(post => (
                    <div key={post._id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{post.title}</h3>
                        <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                          <span>Published: {new Date(post.createdAt).toLocaleDateString()}</span>
                          <span>Likes: {post.likesCount || 0}</span>
                          <span>Comments: {post.commentsCount || 0}</span>
                          {post.mentionedWorkshop && (
                            <span style={{ color: 'var(--accent-cyan)' }}>
                              Workshop: {post.mentionedWorkshop.title}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => setPage('community')}
                        >
                          View Feed
                        </button>
                        <button 
                          className="btn btn-danger"
                          style={{ padding: '0.5rem' }}
                          onClick={() => handleDeletePost(post._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  You have not created any awareness posts yet.
                  <button className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'block', margin: '1.5rem auto 0 auto' }} onClick={() => setPage('community')}>
                    Go to Awareness Forum
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {/* Profile details form */}
              <form onSubmit={handleUpdateProfile} className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={18} style={{ color: 'var(--accent-cyan)' }} /> Personal Profiles
                </h3>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address (Cannot change)</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={email} 
                    disabled 
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                  Save Profile Changes
                </button>
              </form>

              {/* Password update form */}
              <form onSubmit={handlePasswordChange} className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Key size={18} style={{ color: 'var(--warning)' }} /> Authentication configurations
                </h3>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={oldPassword} 
                    onChange={(e) => setOldPassword(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                  Update Password
                </button>
              </form>

              {/* Account destruction */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.02)' }}>
                <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trash2 size={18} /> Danger Zone
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                  Permanently delete your account. This removes all stored enrollments, certificates, and historical scores from the database.
                </p>
                <button type="button" className="btn btn-danger" onClick={handleDeleteAccount}>
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
