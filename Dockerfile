# Multi-stage build for ARK Dashboard
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code and config files
COPY . .

# Copy .env file if it exists (for build-time environment variables)
COPY .env* ./

# Set build-time environment variables with fallbacks
ARG VITE_API_URL
ARG VITE_FRONTEND_ONLY
ENV VITE_API_URL=${VITE_API_URL:-http://localhost:4000}
ENV VITE_FRONTEND_ONLY=${VITE_FRONTEND_ONLY:-false}

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.simple.conf /etc/nginx/conf.d/default.conf

# Ensure proper permissions for nginx
RUN chown -R nginx:nginx /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 