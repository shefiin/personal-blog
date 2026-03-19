FROM node:18

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 8000

CMD ["node", "dist/app.js"]