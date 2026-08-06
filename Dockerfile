# Use Node 22 Bookworm base image (supports Node >= 22 required by modern packages)
FROM node:22-bookworm

# Set working directory
WORKDIR /app

# Install Linux system dependencies for Playwright Chromium
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libsqlite3-0 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2t64 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/* || true

# Copy package manifests
COPY package*.json ./

# Install npm dependencies ignoring script install warnings
RUN npm install --legacy-peer-deps --ignore-scripts || npm install --legacy-peer-deps

# Install Playwright Chromium browser & dependencies
RUN npx playwright install --with-deps chromium

# Copy remaining source code
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application
RUN npm run build

# Expose Next.js server port
EXPOSE 3000

# Start production server
CMD ["npm", "start"]
