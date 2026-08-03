import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <section className="section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '6rem', color: 'var(--accent-color)', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>404</h1>
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Lost in Space?</h2>
        <p style={{ maxWidth: '500px', margin: '0 auto 2.5rem auto', color: 'var(--text-secondary)' }}>
          The page you are looking for does not exist or has been moved. Let's get you back on track.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    </section>
  );
}

export default NotFound;
