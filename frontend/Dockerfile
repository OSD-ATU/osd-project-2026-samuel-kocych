# Build stage
FROM node:22.13.1-alpine AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build -- --configuration production

# Runtime stage
FROM nginx:alpine
# Odstranit defaultní nginx obsah
RUN rm -rf /usr/share/nginx/html/*
# Zkopírovat produkční build Angularu
COPY --from=build /app/dist/recipe-app /usr/share/nginx/html
# Spustit nginx na foreground (Render vyžaduje, aby process běžel)
CMD ["nginx", "-g", "daemon off;"]