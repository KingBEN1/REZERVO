FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app /app
EXPOSE 4000

# `SEED_DEMO_DATA=true` is an explicit, one-time opt-in for a fresh demo database.
# The seed is idempotent, but production operators should switch it off after the first deploy.
CMD ["sh", "-c", "npm run prisma:deploy -w @rezervo/api && if [ \"$SEED_DEMO_DATA\" = \"true\" ]; then npm run prisma:seed -w @rezervo/api; fi && npm run start -w @rezervo/api"]
