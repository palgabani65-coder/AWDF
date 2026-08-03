function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <p className="footer-copy">
          &copy; {currentYear} Pal Gabani. All Rights Reserved. | B.Tech AIML
        </p>
      </div>
    </footer>
  );
}

export default Footer;
