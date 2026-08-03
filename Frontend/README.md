# Portfolio Web Application (Practical 1, 2 & 3)

A modern, responsive React portfolio application built with Vite and React Router, showcasing projects fetched dynamically from the GitHub REST API with state management, loading indicators, error handling, and search filtering.

## 🚀 Practical 3: API Integration & Data Rendering in React

### Objective
To consume a REST API in React and handle asynchronous data with loading and error states.

### Key Features Implemented
- **Dynamic REST API Integration**: Consumes the public GitHub API (`https://api.github.com/users/palgabani65-coder/repos`) to fetch live repositories.
- **Asynchronous State Management**:
  - `repos`: Holds the array of fetched repository objects.
  - `loading`: Boolean state controlling the loading spinner display.
  - `error`: Stores any error message returned during API fetch operations.
- **Modular Component Architecture**:
  - **`Spinner` (`src/components/Spinner.jsx`)**: Animated loading spinner displayed while the request is pending.
  - **`ErrorMessage` (`src/components/ErrorMessage.jsx`)**: Error message card with an interactive **Retry** button that re-triggers the API fetch when an error occurs.
  - **`RepoList` (`src/components/RepoList.jsx`)**: Renders repository cards displaying repo name, description, star count (`⭐`), forks count (`⑂`), language tech stack badges, and GitHub links.
- **Supplementary Features**:
  - **Search Input**: Live filtering of repositories by name or tech stack.
  - **Filter Tabs**: Filter repositories by type (All / Sources / Forks).
  - **Star Count & Metadata**: Displays stargazers count, forks count, default branch, codebase size, and last update timestamp.
  - **Error Testing Switch**: Evaluators can toggle simulated API error mode (`🧪 Test Error State`) to test error UI and retry functionality.

---

## 🛠️ Technology Stack
- **Framework**: React 18+ (Vite)
- **Routing**: React Router DOM v6
- **Styling**: Vanilla CSS (Custom Design System, Bento Grid layout, Dark & Light Mode themes)
- **API**: GitHub REST API (`fetch` API with Promises & `async/await`)

---

## 📁 Component Directory Structure

```text
src/
├── components/
│   ├── About.jsx
│   ├── ErrorMessage.jsx   <-- Practical 3: Error UI & Retry handler
│   ├── Footer.jsx
│   ├── Header.jsx
│   ├── NavBar.jsx
│   ├── RepoList.jsx       <-- Practical 3: Repository list & search filter
│   ├── Skills.jsx
│   └── Spinner.jsx        <-- Practical 3: Loading spinner component
├── pages/
│   ├── Contact.jsx
│   ├── Home.jsx
│   ├── NotFound.jsx
│   └── Projects.jsx       <-- Practical 3: API fetch integration & state management
├── App.jsx
├── index.css
└── main.jsx
```

---

## 💻 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Running

1. **Clone the repository**:
   ```bash
   git clone https://github.com/palgabani65-coder/AWDF.git
   cd Portfolio
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```
