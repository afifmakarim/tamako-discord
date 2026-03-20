FROM node:20-alpine AS builder

# install pnpm
RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

COPY . .
RUN pnpm run build

FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app
COPY --from=builder /app/package.json /app/pnpm-lock.yaml* ./
RUN pnpm install --prod

COPY --from=builder /app/dist ./dist

CMD ["pnpm", "start"]
