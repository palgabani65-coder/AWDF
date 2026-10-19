# Practical 11: Backend Containerization (Node.js/Express)
FROM node:18-alpine

WORKDIR /app

# Cache package manifests for efficient layer caching
COPY package*.json ./
RUN npm install

# Copy application source files
COPY . .

# Expose Express server port
EXPOSE 5000

# Start backend server
CMD ["node", "server.js"]
