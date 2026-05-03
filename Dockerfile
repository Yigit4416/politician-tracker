FROM oven/bun:1 AS frontend-builder

WORKDIR /app

COPY frontend/package.json frontend/bun.lock ./frontend/
WORKDIR /app/frontend
RUN bun install --frozen-lockfile

WORKDIR /app
COPY src ./src
COPY frontend ./frontend

ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

WORKDIR /app/frontend
RUN bun run build

FROM oven/bun:1 AS backend-deps

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1 AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json bun.lock tsconfig.json ./
COPY --from=backend-deps /app/node_modules ./node_modules
COPY src ./src
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 3000

CMD ["bun", "run", "start"]
