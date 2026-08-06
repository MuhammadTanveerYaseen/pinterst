# Use official Microsoft Playwright image (includes Node 20 + Chromium browser dependencies)
FROM mcr.microsoft.com/playwright:v1.45.0-jammy

# Set working directory
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm ci

# Install Playwright Chromium binary
RUN npx playwright install chromium

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
