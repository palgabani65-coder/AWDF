import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import LoadingFallback from './components/LoadingFallback';
import { AuthProvider } from './context/AuthContext';

// Landing page (eagerly loaded for instantaneous LCP and FCP)
import Home from './pages/Home';

// Route-Based Code Splitting with React.lazy() for all secondary pages
const Projects = lazy(() => import('./pages/Projects'));
const Contact = lazy(() => import('./pages/Contact'));
const Todo = lazy(() => import('./pages/Todo'));
const Login = lazy(() => import('./pages/Login'));
const AdminReport = lazy(() => import('./pages/AdminReport'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  const name = "Pal Gabani";
  const themeColor = "#d4af37"; // Solaris Gold primary accent
  const skillList = [
    'Java',
    'Python',
    'Data Analysis',
    'Machine Learning',
    'Web Development',
    'Database Systems'
  ];

  // Theme state: Solaris Gold dark mode canvas by default
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const nextTheme = prevTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', nextTheme);
      return nextTheme;
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
    } else {
      root.classList.add('light-mode');
      root.classList.remove('dark-mode');
    }
  }, [theme]);

  return (
    <AuthProvider>
      <div className="app-container">
        <div className="ambient-glow glow-1"></div>
        <div className="ambient-glow glow-2"></div>
        <NavBar theme={theme} toggleTheme={toggleTheme} />
        
        <main className="main-content">
          <Suspense fallback={<LoadingFallback message="Loading page component..." />}>
            <Routes>
              <Route path="/" element={ <Home name={name} themeColor={themeColor} skillList={skillList} /> } />
              <Route path="/projects" element={<Projects />} />
              <Route path="/todo" element={<Todo />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin/report" element={<AdminReport />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
