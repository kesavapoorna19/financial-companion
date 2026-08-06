# ============================================================
# Financial Companion — Frontend Dockerfile
# Multi-stage:
#   1. node:20-alpine  → build the Vite/React app
#   2. nginx:alpine    → serve static files + proxy /api
# ============================================================

# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# --- Serve stage ---
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
