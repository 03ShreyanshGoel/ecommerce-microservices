FROM node:18-alpine

# Needed for bcrypt + prisma
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm install

# Prisma fix for Alpine
COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# DO NOT hardcode port here → use environment variable
EXPOSE ${PORT}

CMD ["npm", "run", "dev"]