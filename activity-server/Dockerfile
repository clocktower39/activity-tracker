# Not part of the documented deployment (see docs/deployment.md, which runs this
# under systemd behind nginx). Kept correct so it is not a trap if anyone reaches
# for it.

FROM node:22-alpine

WORKDIR /usr/src/app

# Copy manifests first so dependency installation is cached separately from source.
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

COPY . .

ENV NODE_ENV=production
# Containers need to accept connections from outside the container itself, so the
# loopback default that protects a bare VPS is wrong here. Publish this port only
# to the reverse proxy, never to the internet.
ENV HOST=0.0.0.0

EXPOSE 8000

# The API is on loopback in the documented setup, so this is the only health
# signal a container orchestrator gets.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:8000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
