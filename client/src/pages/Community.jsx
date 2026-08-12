import React, { useState, useEffect, useRef } from 'react';
import { Shield, Heart, MessageSquare, Trash2, Pin, Search, Image, X, BookOpen, Send, Calendar, Plus } from 'lucide-react';
import { api } from '../utils/api';

export default function Community({ user, setPage, setSelectedWorkshopId, addToast, setLoginModalOpen }) {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [workshops, setWorkshops] = useState([]);

  // Create post states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [workshopSearch, setWorkshopSearch] = useState('');
  const [showWorkshopDropdown, setShowWorkshopDropdown] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Comments states (keyed by postId)
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [commentsMap, setCommentsMap] = useState({});
  const [commentsLoading, setCommentsLoading] = useState({});
  const [newCommentText, setNewCommentText] = useState({});
  
  // Track user likes locally since the feed backend API only returns likesCount
  const [userLikedPosts, setUserLikedPosts] = useState(() => {
    const saved = localStorage.getItem('cyber_user_likes');
    return saved ? JSON.parse(saved) : {};
  });

  const fileInputRef = useRef(null);

  // Load community posts and workshops
  const loadData = async () => {
    setLoading(true);
    try {
      const postsRes = await api.get('/blogs');
      if (postsRes.success && postsRes.data) {
        setPosts(postsRes.data);
      }
      
      const workshopsRes = await api.get('/workshops');
      if (workshopsRes.success && workshopsRes.data) {
        setWorkshops(workshopsRes.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load community feed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync likes to localStorage
  useEffect(() => {
    localStorage.setItem('cyber_user_likes', JSON.stringify(userLikedPosts));
  }, [userLikedPosts]);

  // Handle Like/Unlike
  const handleLike = async (postId) => {
    if (!user) {
      addToast('Please login to like posts.', 'warning');
      setLoginModalOpen(true);
      return;
    }

    try {
      const res = await api.post(`/blogs/${postId}/like`);
      if (res.success) {
        setPosts(prev => prev.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              likesCount: res.likesCount
            };
          }
          return post;
        }));
        setUserLikedPosts(prev => ({
          ...prev,
          [postId]: res.liked
        }));
      }
    } catch (err) {
      addToast(err.message || 'Failed to like post', 'error');
    }
  };

  // Toggle and load comments
  const handleToggleComments = async (postId) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      return;
    }

    setActiveCommentsPostId(postId);
    
    // Only fetch comments if not loaded or specifically requested
    setCommentsLoading(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await api.get(`/comments/post/${postId}`);
      if (res.success && res.data) {
        setCommentsMap(prev => ({ ...prev, [postId]: res.data }));
      }
    } catch (err) {
      addToast('Failed to load comments', 'error');
    } finally {
      setCommentsLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Add Comment
  const handleAddComment = async (postId) => {
    if (!user) {
      addToast('Please login to comment.', 'warning');
      setLoginModalOpen(true);
      return;
    }

    const text = newCommentText[postId]?.trim();
    if (!text) return;

    try {
      const res = await api.post(`/comments/post/${postId}`, { content: text });
      if (res.success && res.data) {
        setCommentsMap(prev => ({
          ...prev,
          [postId]: [res.data, ...(prev[postId] || [])]
        }));
        setNewCommentText(prev => ({ ...prev, [postId]: '' }));
        
        // Update comments count in posts list
        setPosts(prev => prev.map(post => {
          if (post._id === postId) {
            return { ...post, commentsCount: (post.commentsCount || 0) + 1 };
          }
          return post;
        }));
        addToast('Comment added!', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Failed to add comment', 'error');
    }
  };

  // Delete Own Comment
  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await api.delete(`/comments/${commentId}`);
      if (res.success) {
        setCommentsMap(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).filter(c => c._id !== commentId)
        }));
        setPosts(prev => prev.map(post => {
          if (post._id === postId) {
            return { ...post, commentsCount: Math.max(0, (post.commentsCount || 1) - 1) };
          }
          return post;
        }));
        addToast('Comment deleted', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete comment', 'error');
    }
  };

  // Delete Own Post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete your community post? This will also remove all its comments and likes.')) return;

    try {
      const res = await api.delete(`/blogs/${postId}`);
      if (res.success) {
        setPosts(prev => prev.filter(post => post._id !== postId));
        addToast('Community post deleted successfully', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete post', 'error');
    }
  };

  // Image Selection Handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file', 'warning');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle Post Submit
  const handleCreatePostSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      addToast('Title and content are required', 'warning');
      return;
    }

    setPublishing(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      if (selectedWorkshop) {
        formData.append('mentionedWorkshop', selectedWorkshop._id);
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await api.post('/blogs', formData, true);
      if (res.success && res.data) {
        addToast('Post published successfully!', 'success');
        setPosts(prev => [res.data, ...prev]);
        
        // Reset states
        setTitle('');
        setContent('');
        setSelectedWorkshop(null);
        setWorkshopSearch('');
        setImageFile(null);
        setImagePreview('');
        setShowCreateForm(false);
      }
    } catch (err) {
      addToast(err.message || 'Failed to publish post', 'error');
    } finally {
      setPublishing(false);
    }
  };

  // Filter workshops for mention dropdown
  const filteredWorkshops = workshops.filter(ws =>
    ws.title.toLowerCase().includes(workshopSearch.toLowerCase())
  );

  // Filter posts based on local search
  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="community-container">
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield size={36} style={{ color: 'var(--accent-cyan)' }} />
            Cyber Guard Awareness Forum
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Share threat warnings, report scam behaviors, discuss best digital defense practices, and link lessons.
          </p>
        </div>
        
        <div>
          {user ? (
            <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
              <Plus size={16} /> Create Awareness Post
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={() => { addToast('Please login to create a community post', 'warning'); setLoginModalOpen(true); }}>
              Sign In to Post
            </button>
          )}
        </div>
      </div>

      {/* Local Search Feed */}
      <div className="search-bar-container" style={{ marginBottom: '2rem' }}>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search community posts, tags, fraud patterns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Post Creator Modal Drawer */}
      {showCreateForm && (
        <div className="modal-backdrop" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content glass-panel" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <button 
              className="btn btn-secondary btn-icon" 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none' }}
              onClick={() => setShowCreateForm(false)}
            >
              <X size={18} />
            </button>

            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Publish Awareness Post</h2>

            <form onSubmit={handleCreatePostSubmit}>
              <div className="form-group">
                <label className="form-label">Post Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Summarize the threat warning or topic..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required 
                />
              </div>

              {/* Mentions Workshop Input */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Mention Workshop (Syllabus Link)</label>
                
                {selectedWorkshop ? (
                  <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'var(--accent-cyan)' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', fontWeight: '500' }}>
                      @{selectedWorkshop.title}
                    </span>
                    <button type="button" className="btn btn-secondary btn-icon" style={{ background: 'transparent', border: 'none' }} onClick={() => setSelectedWorkshop(null)}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Search and select a workshop path..."
                      value={workshopSearch}
                      onChange={(e) => {
                        setWorkshopSearch(e.target.value);
                        setShowWorkshopDropdown(true);
                      }}
                      onFocus={() => setShowWorkshopDropdown(true)}
                    />
                    {showWorkshopDropdown && (
                      <div className="glass-panel" style={{ position: 'absolute', width: '100%', zIndex: 10, maxHeight: '200px', overflowY: 'auto', marginTop: '0.25rem', background: 'var(--bg-secondary)' }}>
                        {filteredWorkshops.map(ws => (
                          <div 
                            key={ws._id} 
                            style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                            className="workshop-dropdown-item"
                            onClick={() => {
                              setSelectedWorkshop(ws);
                              setShowWorkshopDropdown(false);
                            }}
                          >
                            {ws.title}
                          </div>
                        ))}
                        {filteredWorkshops.length === 0 && (
                          <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            No workshops matching selection.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Body Content (Markdown Supported)</label>
                <textarea 
                  rows="6" 
                  className="form-control" 
                  placeholder="Provide detailed logs, warning descriptions, links involved, or prevention techniques..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required 
                />
              </div>

              {/* Photo Upload with Preview */}
              <div className="form-group">
                <label className="form-label">Attach Awareness Photo</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.5rem' }}
                    onClick={() => fileInputRef.current.click()}
                  >
                    <Image size={16} /> Choose Image
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept="image/*"
                    onChange={handleImageChange}
                  />

                  {imagePreview && (
                    <div style={{ position: 'relative', width: '100%', maxHeight: '220px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        style={{ width: '100%', height: '220px', objectFit: 'cover' }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-danger btn-icon" 
                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', borderRadius: '50%', padding: '0.4rem' }}
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '1.5rem' }} 
                disabled={publishing}
              >
                {publishing ? 'Publishing Post...' : 'Publish Post to Feed'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Community Feed List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[1, 2, 3].map(n => (
            <div key={n} className="glass-panel card skeleton-pulse" style={{ height: '200px', display: 'flex', background: 'rgba(255,255,255,0.01)' }}></div>
          ))}
        </div>
      ) : filteredPosts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredPosts.map(post => {
            const hasLiked = !!userLikedPosts[post._id];
            const isAuthor = user && post.author?._id === user._id;

            return (
              <article key={post._id} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: post.isPinned ? '4px solid var(--accent-cyan)' : '1px solid var(--border-color)' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--bg-tertiary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>
                        {post.author?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{post.author?.name || 'Anonymous User'}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Published {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {post.isPinned && (
                      <span className="tag" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', borderColor: 'rgba(0, 229, 255, 0.4)', color: 'var(--accent-cyan)', background: 'rgba(0, 229, 255, 0.1)' }}>
                        Pin
                      </span>
                    )}
                    {isAuthor && (
                      <button 
                        className="btn btn-secondary btn-icon" 
                        style={{ border: 'none', background: 'transparent', color: 'var(--danger)' }}
                        onClick={() => handleDeletePost(post._id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>{post.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {post.content}
                  </p>
                </div>

                {/* Image */}
                {post.image && (
                  <div style={{ width: '100%', maxHeight: '420px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                    <img 
                      src={post.image.startsWith('http') ? post.image : `${window.location.origin}${post.image}`} 
                      alt="Post attachment" 
                      style={{ width: '100%', maxHeight: '420px', objectFit: 'cover' }}
                    />
                  </div>
                )}

                {/* Workshop Mentions Badge */}
                {post.mentionedWorkshop && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <span 
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontWeight: '600', cursor: 'pointer', background: 'rgba(0,229,255,0.07)', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.85rem' }}
                      onClick={() => {
                        setSelectedWorkshopId(post.mentionedWorkshop._id);
                        setPage('learning-portal');
                      }}
                    >
                      <BookOpen size={14} /> @ {post.mentionedWorkshop.title}
                    </span>
                  </div>
                )}

                {/* Actions Footer */}
                <div style={{ display: 'flex', gap: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ background: 'transparent', border: 'none', color: hasLiked ? 'var(--accent-cyan)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.5rem' }}
                    onClick={() => handleLike(post._id)}
                  >
                    <Heart size={18} fill={hasLiked ? 'var(--accent-cyan)' : 'transparent'} /> {post.likesCount || 0} Likes
                  </button>

                  <button 
                    className="btn btn-secondary" 
                    style={{ background: 'transparent', border: 'none', color: activeCommentsPostId === post._id ? 'var(--accent-cyan)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.5rem' }}
                    onClick={() => handleToggleComments(post._id)}
                  >
                    <MessageSquare size={18} /> {post.commentsCount || 0} Comments
                  </button>
                </div>

                {/* Collapsible Comments section */}
                {activeCommentsPostId === post._id && (
                  <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', border: 'none', marginTop: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    <h4 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Comments</h4>

                    {/* Add Comment Input Form */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
                        placeholder="Write a constructive security comment..."
                        value={newCommentText[post._id] || ''}
                        onChange={(e) => setNewCommentText(prev => ({ ...prev, [post._id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(post._id);
                        }}
                      />
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '0.5rem 1rem' }}
                        onClick={() => handleAddComment(post._id)}
                      >
                        <Send size={14} /> Send
                      </button>
                    </div>

                    {/* Comments List */}
                    {commentsLoading[post._id] ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading comments...</p>
                    ) : commentsMap[post._id]?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {commentsMap[post._id].map(comment => {
                          const isCommentAuthor = user && comment.author?._id === user._id;
                          return (
                            <div key={comment._id} className="glass-panel" style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                    {comment.author?.name || 'Anonymous User'}
                                  </span>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                {isCommentAuthor && (
                                  <button 
                                    className="btn btn-secondary btn-icon" 
                                    style={{ border: 'none', background: 'transparent', color: 'var(--danger)', padding: '0.1rem' }}
                                    onClick={() => handleDeleteComment(post._id, comment._id)}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                                {comment.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        No comments yet. Start the discussion!
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No awareness postings currently found in local directory database.
        </div>
      )}
    </div>
  );
}
