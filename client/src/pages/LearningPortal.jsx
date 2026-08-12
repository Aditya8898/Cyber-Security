import React, { useState, useEffect } from 'react';
import { BookOpen, PlayCircle, FileText, CheckCircle, Lock, ChevronRight, ChevronLeft, Award, HelpCircle, ExternalLink, MessageSquare } from 'lucide-react';
import { api } from '../utils/api';

export default function LearningPortal({ user, workshopId, setPage, addToast }) {
  const [workshop, setWorkshop] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [modules, setModules] = useState([]);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [readModuleIds, setReadModuleIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quiz states
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizMode, setQuizMode] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [generatedCertificate, setGeneratedCertificate] = useState(null);

  // Community posts & responsive state
  const [communityPosts, setCommunityPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load workshop details, modules, and enrollment
  const loadPortalData = async () => {
    setLoading(true);
    try {
      // 1. Get workshop details
      const wsRes = await api.get(`/workshops/${workshopId}`);
      if (wsRes.success) {
        setWorkshop(wsRes.data);
      }

      // 2. Get user's enrollment for this workshop
      const enrollRes = await api.get('/enrollments/my');
      if (enrollRes.success && enrollRes.data) {
        const matchingEnroll = enrollRes.data.find(e => e.workshop?._id === workshopId);
        if (!matchingEnroll) {
          addToast("You are not enrolled in this workshop", 'warning');
          setPage('workshops');
          return;
        }
        setEnrollment(matchingEnroll);
      }

      // 3. Get modules for this workshop
      const moduleRes = await api.get(`/modules/workshop/${workshopId}`);
      if (moduleRes.success && moduleRes.data) {
        // Sort modules by order
        const sortedModules = moduleRes.data.sort((a, b) => (a.order || 0) - (b.order || 0));
        setModules(sortedModules);
        
        // Setup initial reading progress
        const localRead = localStorage.getItem(`read_modules_${workshopId}`);
        if (localRead) {
          setReadModuleIds(JSON.parse(localRead));
        } else {
          // If first time, auto-mark first module as read or empty
          setReadModuleIds([]);
        }
      }

      // 4. Fetch quiz results or details in background if completion is ready
      const quizRes = await api.get(`/quiz/workshop/${workshopId}`);
      if (quizRes.success && quizRes.data) {
        setQuizQuestions(quizRes.data);
      }
    } catch (err) {
      addToast(err.message || "Failed to load course environment", 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workshopId) {
      loadPortalData();

      // Fetch related community posts
      const fetchWorkshopCommunityPosts = async () => {
        setPostsLoading(true);
        try {
          const res = await api.get('/blogs');
          if (res.success && res.data) {
            const matching = res.data.filter(p => p.mentionedWorkshop?._id === workshopId);
            setCommunityPosts(matching);
          }
        } catch (e) {
          console.error("Failed to load community posts for workshop", e);
        } finally {
          setPostsLoading(false);
        }
      };
      fetchWorkshopCommunityPosts();
    }
  }, [workshopId]);

  // Sync reading progress to backend
  const updateProgressToBackend = async (newReadList) => {
    if (!enrollment || modules.length === 0) return;
    
    const progressPercent = Math.round((newReadList.length / modules.length) * 100);
    try {
      await api.put(`/enrollments/${enrollment._id}/progress`, { progress: progressPercent });
    } catch (err) {
      console.error("Failed to update backend progress:", err);
    }
  };

  // Mark current module as read
  const markCurrentAsRead = () => {
    const currentModule = modules[activeModuleIndex];
    if (!currentModule) return;

    if (!readModuleIds.includes(currentModule._id)) {
      const updated = [...readModuleIds, currentModule._id];
      setReadModuleIds(updated);
      localStorage.setItem(`read_modules_${workshopId}`, JSON.stringify(updated));
      updateProgressToBackend(updated);
      addToast("Module completed!", "success");
    }
  };

  // Navigate modules
  const handleNext = () => {
    markCurrentAsRead();
    if (activeModuleIndex < modules.length - 1) {
      setActiveModuleIndex(prev => prev + 1);
    } else {
      // Reached the end
      addToast("You've reviewed all training modules! Quiz unlocked.", "info");
    }
  };

  const handlePrev = () => {
    if (activeModuleIndex > 0) {
      setActiveModuleIndex(prev => prev - 1);
    }
  };

  // Handle Quiz Submissions
  const handleQuizSubmit = async () => {
    // Validate that all questions are answered
    if (Object.keys(selectedAnswers).length < quizQuestions.length) {
      addToast("Please answer all questions before submitting", "warning");
      return;
    }

    try {
      // Map answers to backend format
      const answerArray = quizQuestions.map((q, idx) => Number(selectedAnswers[idx]));
      const res = await api.post('/quiz/submit', {
        workshopId,
        answers: answerArray
      });

      if (res.success) {
        setQuizResult(res.data);
        if (res.data.passed) {
          addToast("Congratulations! You passed the security assessment.", "success");
        } else {
          addToast("Assessment failed. Please review modules and try again.", "error");
        }
      }
    } catch (err) {
      addToast(err.message || "Failed to submit quiz", "error");
    }
  };

  // Generate Certificate
  const handleGenerateCertificate = async () => {
    if (!quizResult) return;
    setCertificateLoading(true);
    try {
      const res = await api.post('/certificates/generate', {
        quizResultId: quizResult._id
      });
      if (res.success) {
        setGeneratedCertificate(res.data);
        addToast("Certificate Generated Successfully!", "success");
      }
    } catch (err) {
      addToast(err.message || "Failed to generate certificate", "error");
    } finally {
      setCertificateLoading(false);
    }
  };

  // Loading View
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Setting up sandbox environment...</div>;
  }

  if (!workshop) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}>Workshop details not found.</div>;
  }

  // Progress Calculation
  const progressPercent = modules.length > 0 ? Math.round((readModuleIds.length / modules.length) * 100) : 0;
  const isQuizUnlocked = progressPercent >= 100 || readModuleIds.length === modules.length;

  return (
    <div className="learning-portal-layout">
      {/* Mobile Syllabus Toggle Button */}
      <button 
        className="mobile-sidebar-toggle btn btn-secondary" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <BookOpen size={16} /> {sidebarOpen ? "Hide Syllabus" : "Show Syllabus"}
      </button>

      {/* Sidebar Navigation */}
      <aside className={`glass-panel portal-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{workshop.title}</h2>
          <span className="tag">{workshop.level}</span>
        </div>

        {/* Progress Tracker */}
        <div>
          <div className="progress-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Portal Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="progress-track-outer">
            <div className="progress-track-inner" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        {/* Modules List */}
        <nav style={{ flex: 1 }}>
          <h3 className="sidebar-heading" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>Course Syllabus</h3>
          
          <ul className="module-steps-list">
            {modules.map((mod, idx) => {
              const isRead = readModuleIds.includes(mod._id);
              const isActive = activeModuleIndex === idx && !quizMode;
              return (
                <li 
                  key={mod._id}
                  className={`module-step-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveModuleIndex(idx);
                    setQuizMode(false);
                    setSidebarOpen(false); // Close mobile drawer on syllabus click
                  }}
                >
                  {isRead ? (
                    <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                  ) : (
                    <BookOpen size={16} style={{ color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)' }} />
                  )}
                  <span style={{ fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {idx + 1}. {mod.title}
                  </span>
                </li>
              );
            })}

            {/* Quiz Tab */}
            {quizQuestions.length > 0 && (
              <li 
                className={`module-step-item quiz-item ${quizMode ? 'active' : ''} ${!isQuizUnlocked ? 'locked' : ''}`}
                onClick={() => {
                  if (isQuizUnlocked) {
                    setQuizMode(true);
                    setSidebarOpen(false);
                  } else {
                    addToast("Complete all lessons to unlock the security test.", "warning");
                  }
                }}
              >
                {quizResult && quizResult.passed ? (
                  <Award size={16} style={{ color: 'var(--success)' }} />
                ) : !isQuizUnlocked ? (
                  <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <HelpCircle size={16} style={{ color: 'var(--warning)' }} />
                )}
                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Workshop Assessment</span>
              </li>
            )}
          </ul>
        </nav>
      </aside>

      {/* Reader Panel / Content Area */}
      <main className="glass-panel portal-reader">
        {quizMode ? (
          /* Quiz Mode Interface */
          <div className="quiz-container">
            {quizResult ? (
              /* Quiz Results Display */
              <div className="results-screen">
                <div className={`status-badge ${quizResult.passed ? 'passed' : 'failed'}`}>
                  {quizResult.passed ? <Award size={48} /> : <HelpCircle size={48} />}
                </div>
                <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                  {quizResult.passed ? "Assessment Passed" : "Assessment Failed"}
                </h2>
                <div className="score-display">
                  {quizResult.score} / {quizResult.totalMarks || quizResult.totalQuestions}
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                  {quizResult.passed 
                    ? "Great job! You have demonstrated key competencies in identifying and defending against security issues." 
                    : "You did not achieve the required 60% pass rate. Review the course material and try again."}
                </p>

                {quizResult.passed && (
                  <div className="certificate-section-box">
                    <h3 style={{ marginBottom: '1rem' }}>Earn Your Certification</h3>
                    {generatedCertificate ? (
                      <div>
                        <p style={{ color: 'var(--success)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                          Verified Certificate ID: {generatedCertificate.certificateId}
                        </p>
                        <button 
                          className="btn btn-primary"
                          onClick={() => window.open(`${window.location.origin}${generatedCertificate.pdfUrl}`, '_blank')}
                        >
                          Open & Download PDF Certificate
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="btn btn-primary"
                        onClick={handleGenerateCertificate}
                        disabled={certificateLoading}
                      >
                        {certificateLoading ? "Issuing..." : "Claim Verified Certificate"}
                      </button>
                    )}
                  </div>
                )}

                {!quizResult.passed && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setQuizResult(null);
                      setSelectedAnswers({});
                    }}
                  >
                    Retake Security Quiz
                  </button>
                )}
              </div>
            ) : (
              /* Interactive Quiz Taker */
              <div>
                <div className="reader-header">
                  <h1>{workshop.title} - Security Assessment</h1>
                  <p style={{ color: 'var(--text-secondary)' }}>You must score at least 60% to unlock your credential.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1.5rem' }}>
                  {quizQuestions.map((q, idx) => (
                    <div key={q._id} className="quiz-question-box">
                      <span className="quiz-progress">Question {idx + 1} of {quizQuestions.length}</span>
                      <p className="quiz-question-text">{q.question}</p>
                      
                      <ul className="quiz-options-list">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedAnswers[idx] === optIdx;
                          return (
                            <li 
                              key={optIdx} 
                              className={`quiz-option-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => setSelectedAnswers(prev => ({ ...prev, [idx]: optIdx }))}
                            >
                              <span className="quiz-option-number">{String.fromCharCode(65 + optIdx)}</span>
                              <span>{opt}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                  <button className="btn btn-secondary" onClick={() => setQuizMode(false)}>
                    Review Material
                  </button>
                  <button className="btn btn-primary" onClick={handleQuizSubmit}>
                    Submit Assessment
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Lesson / Module Reading View */
          modules.length > 0 ? (
            <div>
              <div className="reader-header">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lesson {activeModuleIndex + 1} of {modules.length}</span>
                <h1 style={{ marginTop: '0.25rem' }}>{modules[activeModuleIndex]?.title}</h1>
              </div>

              {/* Video Embed Placeholder */}
              {modules[activeModuleIndex]?.videoUrl && (
                <div 
                  className="video-placeholder"
                  onClick={() => window.open(modules[activeModuleIndex].videoUrl, '_blank')}
                >
                  <div className="video-play-btn">
                    <PlayCircle size={32} />
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--accent-blue)' }}>
                    Watch Training Lecture <ExternalLink size={14} style={{ verticalAlign: 'middle', marginLeft: '0.25rem' }} />
                  </span>
                </div>
              )}

              {/* Theory Content */}
              <div className="theory-content">
                {modules[activeModuleIndex]?.theory?.split('\n').map((para, i) => (
                  <p key={i} style={{ marginBottom: '1rem' }}>{para}</p>
                ))}
              </div>

              {/* PDF Attachments */}
              {modules[activeModuleIndex]?.pdfUrl && (
                <div className="attachment-section">
                  <div className="attachment-card">
                    <FileText size={24} style={{ color: 'var(--accent-cyan)' }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.9rem' }}>Workshop Attachment / Handout</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF Document</span>
                    </div>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => window.open(`${window.location.origin}${modules[activeModuleIndex].pdfUrl}`, '_blank')}
                    >
                      Download
                    </button>
                  </div>
                </div>
              )}

              {/* Reader Action Controls */}
              <div className="reader-actions" style={{ marginBottom: '2.5rem' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={handlePrev}
                  disabled={activeModuleIndex === 0}
                >
                  <ChevronLeft size={16} /> Previous Lesson
                </button>

                {activeModuleIndex < modules.length - 1 ? (
                  <button className="btn btn-primary" onClick={handleNext}>
                    Mark as Read & Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      markCurrentAsRead();
                      if (quizQuestions.length > 0) {
                        setQuizMode(true);
                      } else {
                        addToast("Workshop modules completed!", "success");
                      }
                    }}
                  >
                    {quizQuestions.length > 0 ? "Unlock Security Assessment" : "Complete Workshop"} <ChevronRight size={16} />
                  </button>
                )}
              </div>

              {/* Community posts section linking to workshop */}
              <div className="workshop-community-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={20} style={{ color: 'var(--accent-cyan)' }} />
                  Community Posts
                </h3>
                
                {postsLoading ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading posts...</p>
                ) : communityPosts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {communityPosts.map(post => (
                      <div key={post._id} className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          <span>By {post.author?.name || 'Anonymous'}</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>{post.title}</h4>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', lineHeight: '1.5' }}>
                          {post.content}
                        </p>
                        <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <span>{post.likesCount || 0} Likes</span>
                          <span>{post.commentsCount || 0} Comments</span>
                          <span 
                            style={{ color: 'var(--accent-cyan)', cursor: 'pointer', marginLeft: 'auto', fontWeight: '600' }}
                            onClick={() => setPage('community')}
                          >
                            View in Forum &rarr;
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    No community posts mention this workshop yet.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No learning modules have been loaded for this workshop yet.
            </div>
          )
        )}
      </main>
    </div>
  );
}
