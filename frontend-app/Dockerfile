FROM node:20 AS build
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --legacy-peer-deps && \
    npm install --no-save @rollup/rollup-linux-x64-gnu

# Copy source files
COPY . .

# Railway automatically provides environment variables during build
# Use ARG to accept them
ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE

# Build the app
RUN npm run build

FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Railway injects PORT
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]