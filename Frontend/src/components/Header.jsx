function Header({ name }) {
  return (
    <header className="hero-section">
      <div className="hero-overlay"></div>
      <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="hero-content" style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
          <span className="hero-sub">
            Available for new opportunities
          </span>
          <h1 className="hero-title" style={{ fontSize: '4.5rem' }}>
            {name || 'Pal Gabani'}
          </h1>
          <p className="hero-desc" style={{ margin: '0 auto 2.5rem auto' }}>
            Focusing on component-driven UI architecture, lightweight bundlers, and structured client data flows within the Advanced Web Development Frameworks course.
          </p>
          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            <a href="#about" className="btn btn-primary">
              Explore Biography
            </a>
            <a href="#contact" className="btn btn-secondary">
              Get Contact Info
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
