FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# .dockerignore keeps .env out of the build context, and `prisma generate`
# needs no database URL (see prisma.config.ts), so no secret enters the build.
COPY . .
RUN npx prisma generate && npm run build

FROM node:24-alpine AS runner
WORKDIR /app

ARG NODE_ENV=production
ARG PORT=3030
ENV NODE_ENV=${NODE_ENV} \
    PORT=${PORT}

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# DATABASE_URL, SUPABASE_URL and SUPABASE_ANON_KEY are supplied at runtime and
# never baked into the image: `docker run --env-file .env …` locally, service
# environment variables on Render (which also overrides PORT).
EXPOSE ${PORT}
CMD ["node", "dist/main"]
