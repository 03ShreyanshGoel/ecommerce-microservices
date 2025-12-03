FROM node:18-alpine

# Needed for bcrypt + prisma
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE ${PORT}

CMD ["sh", "-c", "npx prisma db push && npm run dev"]
