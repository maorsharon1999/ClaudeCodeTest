FROM node:22-alpine

# Non-root user for security
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src/ ./src/

# Cloud Run: static uploads dir not needed (Firebase Storage handles files)
# Create empty dirs so the app doesn't crash on boot in hybrid mode
RUN mkdir -p uploads/voice uploads/photos

# Run as non-root
USER app

EXPOSE 3000

CMD ["node", "src/index.js"]
