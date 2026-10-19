# Full-Stack Task Management & Portfolio Application

An enterprise-ready, containerized full-stack task management application developed for the **Advanced Web Development Frameworks (AWDF)** course.

---

## Architecture Overview (Practical 11: Docker Containerization)

The entire application stack is containerized using Docker and orchestrated using Docker Compose across an internal bridge network (`app-network`).

```text
docker-compose.yml
├── frontend (React + Vite, built + served on port 5173)
├── backend  (Node.js + Express REST API on port 5000)
└── mongodb  (Official MongoDB container with volume persistence on port 27017)

Network: app-network (bridge)
frontend (5173) ──► backend (5000) ──► mongodb (27017)
```

---

## Quick Start: Running the Full Stack with Docker Compose

Ensure Docker and Docker Compose (or Docker Desktop) are installed and running.

### 1. Start the entire application stack:
```bash
docker-compose up --build
```
Or run detached in the background:
```bash
docker-compose up -d --build
```

### 2. Access the running services:
- **Frontend Web Application:** [http://localhost:5173](http://localhost:5173)
- **Backend REST API:** [http://localhost:5000](http://localhost:5000)
- **MongoDB Database:** `mongodb://localhost:27017/taskdb`

### 3. Verify running containers:
```bash
docker ps
```

### 4. View container logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### 5. Stop the application stack:
```bash
# Stop containers
docker-compose down

# Stop containers and remove named persistent volumes (clean reset)
docker-compose down -v
```

---

## Local Development (Without Docker)

### Backend:
```bash
cd Backend
npm install
node server.js
```

### Frontend:
```bash
cd Frontend
npm install
npm run dev
```

---

## Laboratory Practicals Index

- **Practical 4–9:** REST API, Level 2 Richardson Maturity, JWT Authentication, RBAC, Admin Analytics & Caching.
- **Practical 10:** Asynchronous Processing with Event-Driven Architecture (`EventEmitter`). Documentation: [PRACTICAL-10.md](file:///d:/Study/AWDF/Portfolio/PRACTICAL-10.md).
- **Practical 11:** Containerization with Docker & Docker Compose (`Dockerfile`, `docker-compose.yml`). Documentation: [PRACTICAL-11.md](file:///d:/Study/AWDF/Portfolio/PRACTICAL-11.md).
