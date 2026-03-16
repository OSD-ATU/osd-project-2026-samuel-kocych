# Build stage
FROM node:22.13.1-alpine AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build -- --configuration production

# Runtime stage
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist/recipe-app/browser /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]