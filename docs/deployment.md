# Deploying to a subdomain

Target shape: one VPS running nginx, which serves the built client as static
files and proxies `/api` to the Node process on loopback. Cloudflare sits in
front for DNS and TLS.

```
browser ──► Cloudflare ──► nginx :443 ──┬── /        static files from dist/
                                        └── /api     proxy to 127.0.0.1:8000
```

Everything is same-origin, which is the point: no CORS, no hostname compiled
into the bundle, and nothing to change when the domain does.

No hostname appears anywhere in this repository. Substitute your own wherever
`YOUR_SUBDOMAIN` appears below.

---

## 1. Build the client

```bash
cd activity-client
yarn install
yarn build            # -> activity-client/dist
```

The defaults already target a subdomain root (`VITE_BASE_PATH=/`) with a
same-origin API. Nothing needs configuring for the documented setup.

Copy `dist/` to the server, e.g. `/var/www/activity-tracker`.

## 2. Run the API

```bash
cd activity-server
yarn install --production
cp .env.example .env      # fill in DBURL and both secrets
node server.js
```

With `NODE_ENV=production` the process binds `127.0.0.1:8000`, so only nginx on
the same machine can reach it. It refuses to start if either JWT secret is under
32 characters. Generate them with `openssl rand -base64 48`.

### systemd unit

`/etc/systemd/system/activity-api.service`:

```ini
[Unit]
Description=Activity Tracker API
After=network.target

[Service]
Type=simple
User=activity
WorkingDirectory=/srv/activity-tracker/activity-server
EnvironmentFile=/srv/activity-tracker/activity-server/.env
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5

# The process needs nothing outside its own directory.
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/srv/activity-tracker/activity-server

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now activity-api
sudo systemctl status activity-api
```

## 3. nginx

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name YOUR_SUBDOMAIN;

    ssl_certificate     /etc/ssl/cloudflare/YOUR_SUBDOMAIN.pem;
    ssl_certificate_key /etc/ssl/cloudflare/YOUR_SUBDOMAIN.key;

    root /var/www/activity-tracker;
    index index.html;

    # The API, same origin as the app.
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        # $remote_addr is the real client because of the real_ip block in §4.
        proxy_set_header X-Forwarded-For   $remote_addr;
        proxy_read_timeout 30s;
    }

    # Hashed assets are immutable; the filename changes when content does.
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Never cache these two, or an update can leave clients pinned to an old
    # bundle: the service worker and the HTML that references the new assets.
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Client-side routing: any unmatched path is a route, not a missing file.
    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}

server {
    listen 80;
    listen [::]:80;
    server_name YOUR_SUBDOMAIN;
    return 301 https://$host$request_uri;
}
```

## 4. Cloudflare and the real client IP

**This one matters.** The auth endpoints are rate limited per IP. Behind
Cloudflare, nginx sees *Cloudflare's* address on every request — so without the
block below, every visitor shares a single bucket and twenty failed sign-ins
from anyone locks out everybody.

Put this in `http {}` (e.g. `/etc/nginx/conf.d/cloudflare-realip.conf`):

```nginx
# Current ranges: https://www.cloudflare.com/ips/
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;
set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2a06:98c0::/29;
set_real_ip_from 2c0f:f248::/32;

real_ip_header CF-Connecting-IP;
```

With that in place `$remote_addr` is the visitor, nginx forwards it, and
`TRUST_PROXY=1` makes it `req.ip` in Express.

**Verify it rather than assume it.** From two different networks (e.g. laptop
and phone on mobile data), fail a sign-in a few times from one and confirm the
other is unaffected:

```bash
for i in $(seq 1 21); do
  curl -s -o /dev/null -w "%{http_code} " -X POST https://YOUR_SUBDOMAIN/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"nobody@example.com","password":"wrong"}'
done; echo
```

The 21st should be `429`. If the *other* device is also blocked, the real-IP
config is not working.

### Cloudflare settings

- **SSL/TLS mode: Full (strict)** with a Cloudflare Origin certificate on the
  VPS. "Flexible" would leave Cloudflare→origin unencrypted.
- **Do not enable "Rocket Loader" or JS minification** on this hostname; both
  rewrite the bundle and can break the service worker.
- Cloudflare's default cache rules leave HTML uncached, which is what the
  no-cache headers above want. If you add a cache-everything page rule, exclude
  `/index.html`, `/sw.js` and `/api/*`.

## 5. Oracle Cloud firewall

The free tier blocks ports at two layers and both must be opened:

1. **Security list / NSG** in the OCI console: ingress 80 and 443 from
   `0.0.0.0/0`.
2. **The instance's own iptables**, which Oracle images ship with a restrictive
   default:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

Port 8000 stays closed. The API is on loopback and reached only through nginx.

## 6. After the move

- **Everyone signs in again.** Tokens live in `localStorage`, which is scoped to
  the origin, so nothing carries over from the old address. Expected, not a bug.
- **Retire the old path.** Anyone who installed the PWA from
  `/activity-tracker/` has a service worker still registered against that scope.
  It cannot be reached from the new origin, so serve a redirect or a short "moved
  here" page at the old location rather than leaving a stale copy running.
- **Check the API is not exposed directly:**

```bash
curl -m 5 http://YOUR_SERVER_IP:8000/api/health   # should fail to connect
curl -s https://YOUR_SUBDOMAIN/api/health         # should return {"ok":true,...}
```

## Staying on the old sub-path instead

Nothing here is one-way. Build with `VITE_BASE_PATH=/activity-tracker/` and the
asset base, router basename and PWA scope all follow it.
