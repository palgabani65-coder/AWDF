import Header from '../components/Header';
import About from '../components/About';
import Skills from '../components/Skills';

function Home({ name, themeColor, skillList }) {
  return (
    <>
      <Header name={name} themeColor={themeColor} />
      <About />
      <Skills skillList={skillList} />
    </>
  );
}

export default Home;
