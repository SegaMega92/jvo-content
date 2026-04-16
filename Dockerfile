FROM node:20-slim

# Install system dependencies for Playwright and Sharp
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    ca-certificates \
    fonts-liberation \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install --production=false

# Install Playwright Chromium
RUN npx playwright install chromium

# Copy fonts
COPY assets/fonts/ /usr/local/share/fonts/
RUN fc-cache -f -v 2>/dev/null || true

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
