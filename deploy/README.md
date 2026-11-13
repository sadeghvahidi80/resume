# Deployment Guide — sadeghvahidi.ir

The site is fully static (HTML/CSS/JS). No build step required.

## Option 1: Cloudflare Pages (recommended for Iran accessibility)

### Dashboard setup
1. Go to https://dash.cloudflare.com → Pages → Create a project.
2. Connect the GitHub repo `sadeghvahidi80/resume`.
3. Framework preset: **None**.
4. Build command: *(leave empty)*.
5. Build output directory: `/` (root).
6. Click "Save and Deploy".
7. Custom domain: add `sadeghvahidi.ir` in Pages → Custom domains.
8. DNS: point `sadeghvahidi.ir` to Cloudflare (change nameservers at your registrar).

### CLI deploy
```bash
npx wrangler pages deploy . --project-name=sadeghvahidi
```

### GitHub Action (optional)
Add secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to the repo.
The workflow `.github/workflows/deploy-cloudflare.yml` will auto-deploy on push to main.

## Option 2: VPS (nginx)

### Prerequisites
- A VPS with nginx installed (Ubuntu/Debian recommended).
- A domain pointing to the VPS IP.
- SSH access.

### Setup
```bash
# 1. Copy nginx config
sudo cp deploy/nginx.conf /etc/nginx/sites-available/sadeghvahidi.ir
sudo ln -s /etc/nginx/sites-available/sadeghvahidi.ir /etc/nginx/sites-enabled/

# 2. Get SSL certificate
sudo certbot --nginx -d sadeghvahidi.ir -d www.sadeghvahidi.ir

# 3. Create web root
sudo mkdir -p /var/www/sadeghvahidi.ir

# 4. Deploy files
./deploy/vps-deploy.sh user@your-vps-ip /var/www/sadeghvahidi.ir
```

### GitHub Action (optional)
Add secrets `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PATH` to the repo.
The workflow `.github/workflows/deploy-vps.yml` will auto-deploy on push to main.

## Iran accessibility notes
- The site is fully self-contained (no external auto-loaded resources).
- All fonts are self-hosted (IranNastaliq from assets/fonts/).
- No Google Fonts, no CDN, no analytics scripts.
- The contact form submits to formspree.io (may be blocked in Iran — consider a self-hosted endpoint).
- GitHub Pages IPs (185.199.x.x) are blocked in Iran — use Cloudflare Pages or VPS for Iran accessibility.
