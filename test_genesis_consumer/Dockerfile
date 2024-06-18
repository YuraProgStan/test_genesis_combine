# Stage 1: Build the consumer application
FROM node:18-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# Build the application
RUN npm run build

# Verify the dist directory exists and list contents
RUN echo "Checking /usr/src/app directory" && ls -la /usr/src/app
RUN echo "Checking /usr/src/app/dist directory" && ls -la /usr/src/app/dist || echo "Dist directory not found"

# Stage 2: Run the consumer application
FROM node:18-alpine

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/dist ./dist

RUN npm install --only=production

# Install bash
RUN apk add --no-cache bash

COPY wait-for-it.sh /usr/src/app/
RUN chmod +x /usr/src/app/wait-for-it.sh

EXPOSE 3000

CMD ["./wait-for-it.sh", "postgres:5432", "--", "node", "dist/src/main"]
