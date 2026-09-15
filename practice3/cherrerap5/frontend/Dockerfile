# Build Stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN --mount=type=secret,id=trusted_ca \
    if [ -f /run/secrets/trusted_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/trusted_ca; fi; \
    npm ci
COPY . .
RUN npm run build -- --configuration production

# Serving Stage
FROM nginx:alpine
COPY --from=build /app/dist/enterprise-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
