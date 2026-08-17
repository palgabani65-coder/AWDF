import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Projects from './pages/Projects';
import Contact from './pages/Contact';
import Todo from './pages/Todo';
import NotFound from './pages/NotFound';

function App() {
  const name = "Pal Gabani";
  const themeColor = "#2dd4bf"; // Mint Teal theme color prop
  const skillList = [
    'Java',
    'Python',
    'Data Analysis',
    'Machine Learning',
    'Web Development',
    'Database Systems'
  ];

  // Theme state: light mode by default matching soft blue background
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
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
    <div className="app-container">
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>
      <NavBar theme={theme} toggleTheme={toggleTheme} />
      
      <main className="main-content">
          <Routes>
          <Route path="/" element={ <Home name={name} themeColor={themeColor} skillList={skillList} /> } />
          <Route path="/projects" element={<Projects />} />
          <Route path="/todo" element={<Todo />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
