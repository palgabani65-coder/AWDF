function Skills({ skillList }) {
  const listToRender = skillList || [];

  const skillDetails = {
    'Java': { level: 85, tag: 'OOP', desc: 'Designing object-oriented class structures, packaging logic, and building clean console integrations.' },
    'Python': { level: 92, tag: 'Logic', desc: 'Writing analytical scripts, creating clean conditional workflows, and processing data frames.' },
    'Data Analysis': { level: 88, tag: 'Analytics', desc: 'Mining information, formatting datasets, and graphing statistical results.' },
    'Machine Learning': { level: 84, tag: 'AI/ML', desc: 'Implementing regression models, classifier setups, and neural clustering.' },
    'Web Development': { level: 90, tag: 'Frontend', desc: 'Building modular component templates, state hooks, and responsive layout styling.' },
    'Database Systems': { level: 86, tag: 'Backend', desc: 'Configuring structural schemas, modeling relational tables, and optimizing query speeds.' }
  };

  const getInfo = (name) => {
    return skillDetails[name] || { level: 80, tag: 'Skill', desc: 'Proficient technical execution.' };
  };

  return (
    <section id="skills" className="section">
      <div className="container">
        <h2 className="section-title">Technical Skills</h2>
        <ul className="skills-list">
          {listToRender.map((s) => {
            const info = getInfo(s);
            return (
              <li key={s}>
                <div className="skill-header">
                  <span className="skill-name">{s}</span>
                  <span className="skill-tag">{info.tag}</span>
                </div>
                <p className="skill-desc">{info.desc}</p>
                <div className="skill-progress-bar">
                  <div 
                    className="skill-progress" 
                    style={{ width: `${info.level}%` }}
                    aria-label={`Skill level ${info.level}%`}
                  ></div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default Skills;
