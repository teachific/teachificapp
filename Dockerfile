FROM node:22-alpine AS base
RUN npm install -g pnpm

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept VITE_* build-time variables so they get baked into the frontend bundle
ARG VITE_APP_ID
ARG VITE_APP_TITLE
ARG VITE_APP_LOGO
ARG VITE_OAUTH_PORTAL_URL
ARG VITE_FRONTEND_FORGE_API_KEY
ARG VITE_FRONTEND_FORGE_API_URL
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_ANALYTICS_ENDPOINT
ARG VITE_ANALYTICS_WEBSITE_ID

# Export them as environment variables for the vite build step
ENV VITE_APP_ID=$VITE_APP_ID
ENV VITE_APP_TITLE=$VITE_APP_TITLE
ENV VITE_APP_LOGO=$VITE_APP_LOGO
ENV VITE_OAUTH_PORTAL_URL=$VITE_OAUTH_PORTAL_URL
ENV VITE_FRONTEND_FORGE_API_KEY=$VITE_FRONTEND_FORGE_API_KEY
ENV VITE_FRONTEND_FORGE_API_URL=$VITE_FRONTEND_FORGE_API_URL
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_ANALYTICS_ENDPOINT=$VITE_ANALYTICS_ENDPOINT
ENV VITE_ANALYTICS_WEBSITE_ID=$VITE_ANALYTICS_WEBSITE_ID

RUN pnpm build

# Production runtime
FROM node:22-alpine AS runner
RUN npm install -g pnpm
WORKDIR /app
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
