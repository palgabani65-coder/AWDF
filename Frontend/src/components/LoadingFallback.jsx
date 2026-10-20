import { useState, useEffect } from 'react';

/**
 * LoadingFallback Component for React Suspense
 * 
 * Features:
 * 1. Minimum delay threshold (300ms default) to avoid flickering loading states on fast connections.
 * 2. Smooth animated pulse ring and spinner.
 * 3. Accessible status indicator with high-contrast badge.
 */
function LoadingFallback({ message = "Loading module...", delay = 300, fullPage = false }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Supplementary Problem 2: Delay rendering by 300ms to eliminate flash of loading content on fast connections
    const timer = setTimeout(() => {
      setVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) {
    return null; // Return nothing during the initial 300ms grace window
  }

  return (
    <div 
      className={`route-fallback-container ${fullPage ? 'full-page' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
    >
      <div className="route-fallback-card">
        <div className="fallback-spinner-wrapper">
          <div className="fallback-pulse-ring"></div>
          <div className="fallback-spinner"></div>
        </div>
        <div className="fallback-content">
          <span className="fallback-badge">Code-Split Chunk</span>
          <p className="fallback-text">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default LoadingFallback;
