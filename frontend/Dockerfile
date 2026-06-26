# ==========================================
# Stage 1: Build — compila el proyecto React
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Primero copiamos package.json para cachear node_modules
COPY package*.json ./
RUN npm ci

# Copiamos el resto del código
COPY . .

# Build de producción
RUN npm run build

# ==========================================
# Stage 2: Runtime — Nginx sirve el dist/
# ==========================================
FROM nginx:alpine

# Copiamos nuestra configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos el build generado
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
