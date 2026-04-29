# Build stage
FROM node:25-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
# Note: VITE_API_BASE can be passed during build if needed
ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

# Production stage
FROM nginx:stable-alpine

ENV NGINX_ENTRYPOINT_QUIET_LOGS=1

# Copy the build output from the build stage to nginx's serve directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy a custom nginx config if needed (optional, for SPA routing)
# RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
