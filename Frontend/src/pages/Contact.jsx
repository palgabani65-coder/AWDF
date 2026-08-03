import { useState } from 'react';

function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setEmail('');
      setMessage('');
    }, 5000);
  };

  const handleMessageChange = (e) => {
    if (e.target.value.length <= 250) {
      setMessage(e.target.value);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Get In Touch</h2>

        <div className="bento-grid">
          {/* Contact Details Panel */}
          <div className="bento-card contact-info-panel">
            <h3 style={{ fontSize: '1.25rem' }}>Let's Connect</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Have questions about modern component logic or Vite project bundles? Reach out.
            </p>

            <div className="contact-card" style={{ marginTop: '1rem' }}>
              <div className="contact-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div>
                <h4>Email</h4>
                <p>pal.gabani@example.com</p>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <h4>Campus</h4>
                <p>Changa, Anand, Gujarat</p>
              </div>
            </div>
          </div>

          {/* Contact Form Panel */}
          <div className="bento-card span-2">
            {submitted ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                padding: '2rem'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(45, 212, 191, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3>Message Sent Successfully!</h3>
                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                  Thank you for reaching out, {name}. I will get back to you shortly.
                </p>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="name-input">Full Name</label>
                  <input 
                    className="form-input" 
                    id="name-input" 
                    type="text" 
                    placeholder="John Doe" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="email-input">Email Address</label>
                  <input 
                    className="form-input" 
                    id="email-input" 
                    type="email" 
                    placeholder="john@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <label className="form-label" htmlFor="msg-input" style={{ marginBottom: 0 }}>Message</label>
                    <button 
                      type="button"
                      onClick={() => setShowTooltip(!showTooltip)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: showTooltip ? 'var(--accent-color)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'all 0.2s ease'
                      }}
                      title="Click for message guidelines"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </button>
                  </div>

                  {showTooltip && (
                    <div style={{
                      marginTop: '0.5rem',
                      marginBottom: '0.5rem',
                      padding: '0.8rem 1rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color-hover)',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.4',
                      zIndex: 10,
                      animation: 'fadeIn 0.2s ease'
                    }}>
                      💡 <strong>Guidelines:</strong> Keep your message professional and brief (max 250 characters). Perfect for questions about class assignments, projects, or collaborations.
                    </div>
                  )}

                  <textarea 
                    className="form-textarea" 
                    id="msg-input" 
                    rows="3" 
                    placeholder="Write message details..." 
                    value={message}
                    onChange={handleMessageChange}
                    required
                  ></textarea>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.75rem' }}>
                    <span style={{ color: message.length > 220 ? '#ef4444' : 'var(--text-muted)' }}>
                      {message.length} / 250 characters
                    </span>
                    {message.length >= 250 && (
                      <span style={{ color: '#ef4444' }}>Character limit reached</span>
                    )}
                  </div>
                </div>

                {/* Real-time controlled inputs display */}
                {(name || email || message) && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem'
                  }}>
                    <h4 style={{ color: 'var(--accent-color)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Preview</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <p><strong>Sender:</strong> {name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Anonymous</span>}</p>
                      <p><strong>Email:</strong> {email || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not provided</span>}</p>
                      <p style={{ wordBreak: 'break-all' }}>
                        <strong>Message:</strong> {message || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Empty</span>}
                      </p>
                    </div>
                  </div>
                )}

                <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start', marginTop: '1rem' }}>
                  Send Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
