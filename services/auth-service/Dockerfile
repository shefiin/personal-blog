FROM node:18

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy source
COPY . .

# Build project
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/src/app.js"]