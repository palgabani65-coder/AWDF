# Practical 11: Frontend Containerization (React + Vite)
# Multi-stage build pattern
FROM node:18-alpine AS build

WORKDIR /app

# Cache package manifests for efficient layer caching
COPY package*.json ./
RUN npm install

# Copy source code and build production bundle
COPY . .
RUN npm run build

# Expose Vite preview port
EXPOSE 5173

# Serve built production assets bound to all network interfaces (0.0.0.0)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
