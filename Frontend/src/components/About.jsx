function About() {
  return (
    <section id="about" className="section">
      <div className="container">
        <h2 className="section-title">About Me</h2>

        <div className="bento-grid about-bento-grid">
          {/* Card 1: Avatar */}
          <div className="bento-card avatar-bento">
            <div className="about-avatar">PG</div>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Pal Gabani</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                @palgabani
              </p>
            </div>
          </div>

          {/* Card 2: Bio Text */}
          <div className="bento-card span-2">
            <h3 className="about-bento-title">Biography</h3>
            <p className="about-bento-desc">
              I am Pal Gabani, a AIML student currently pursuing my studies at CHARUSAT. I enjoy coding clean web interfaces, building custom layouts, and designing reusable client components.
            </p>
            <p className="about-bento-desc" style={{ marginTop: '1rem' }}>
              My engineering focus centers on clean state lifecycle operations, optimized asset bundling, and clean user experience flows. This page uses structured modules to showcase modern frontend setups.
            </p>
          </div>

          {/* Card 3: Timeline */}
          <div className="bento-card span-2">
            <h4 className="timeline-title">Education</h4>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-date">2024 - Present</div>
                <div className="timeline-name">B.Tech in AIML</div>
                <div className="timeline-desc">FTE, CHARUSAT University. Focus on Algorithmic Design, Database Systems, and Web Application Architectures.</div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-date">2022 - 2024</div>
                <div className="timeline-name">Higher Secondary Board</div>
                <div className="timeline-desc">Mathematical sciences and analytics foundation. Graduated with first-class honors.</div>
              </div>
            </div>
          </div>

          {/* Card 4: Stats */}
          <div className="bento-card">
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-num">7.6</span>
                <span className="stat-label">CGPA</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">SEM5</span>
                <span className="stat-label">Current Term</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
