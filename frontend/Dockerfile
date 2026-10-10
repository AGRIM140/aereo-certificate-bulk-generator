# Production Dockerfile for Frontend (Vite + React)
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source
COPY . .

# Build production bundle
RUN npm run build

# Production Nginx stage
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV PORT=80 \
    BACKEND_URL=http://backend:8000 \
    NGINX_ENVSUBST_FILTER="^(PORT|BACKEND_URL)$"

# Copy build artifacts
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
