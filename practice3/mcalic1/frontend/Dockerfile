# Build Stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# --ignore-scripts avoids admin-lte's transitive husky/summernote postinstall failing in CI/containers
RUN npm install --ignore-scripts
COPY . .
RUN npm run build -- --configuration production

# Serving Stage
FROM nginx:alpine
COPY --from=build /app/dist/enterprise-frontend/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]