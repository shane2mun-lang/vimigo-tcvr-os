# vimigo TCVR Revenue OS — single-image deploy.
FROM node:22-slim
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter frontend build
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "backend", "start"]
