FROM node:18-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --force

COPY . .

RUN npm run build

RUN echo "Checking /usr/src/app directory" && ls -la /usr/src/app
RUN echo "Checking /usr/src/app/dist directory" && ls -la /usr/src/app/dist || echo "Dist directory not found"

FROM node:18-alpine

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/dist ./dist

RUN npm install --only=production

RUN apk add --no-cache bash

COPY wait-for-it.sh /usr/src/app/
RUN chmod +x /usr/src/app/wait-for-it.sh

EXPOSE 3000

CMD ["./wait-for-it.sh", "postgres:5432", "--", "node", "dist/src/main"]
