# Web Tool - Online Navigation

[中文文档](./README.md)

A web navigation tool based on HTML + CSS + JavaScript, with a clean and beautiful interface, supporting URL submission and suitable for personal or team use.

## Features

- Pure static HTML pages, no backend required
- Responsive design, mobile-friendly
- Day/Night mode toggle
- Clear categorization with quick search
- PWA offline access with isolated site caches and API bypass
- URL submission feature for easy management
- Simple deployment, supports multiple deployment methods

## Project Repository

- GitHub: https://github.com/hadis112233/web_tool

## Quick Start

### Local Preview

1. Clone the repository
```bash
git clone https://github.com/hadis112233/web_tool.git
cd web_tool
```

2. Run with any HTTP server
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (requires http-server)
npx http-server -p 8000

```

3. Visit `http://localhost:8000` in your browser

> Use a local HTTP server instead of opening `index.html` directly. The browser's `file://` mode cannot correctly test PWA behavior, API paths, or extensionless routes.

## Deployment Guide

### Method 1: Nginx Deployment

#### 1. Prerequisites

Ensure Nginx is installed on your server:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

#### 2. Upload Files

Upload project files to the server:

```bash
# Create website directory
sudo mkdir -p /var/www/web_tool

# Upload files (run locally)
scp -r ./* user@your-server:/var/www/web_tool/

# Or use git clone on server
cd /var/www
sudo git clone https://github.com/hadis112233/web_tool.git
```

#### 3. Configure Nginx

Create Nginx configuration file:

```bash
sudo vim /etc/nginx/sites-available/web_tool
```

The repository already includes a configuration template synchronized with the current security headers, routes, and caching policy. Copy it, then update only the certificate paths and site root:

```bash
sudo cp nginx/web.008997.xyz.conf.example /etc/nginx/sites-available/web_tool
sudo vim /etc/nginx/sites-available/web_tool
```

#### 4. Enable Site and Restart Nginx

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/web_tool /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable on boot
sudo systemctl enable nginx
```

#### 5. Configure HTTPS (Optional but Recommended)

Use Let's Encrypt free certificate:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate and auto-configure Nginx
sudo certbot --nginx -d your-domain.com

# Setup auto-renewal
sudo certbot renew --dry-run
```

#### Nginx Security and Routing

Use `nginx/web.008997.xyz.conf.example` as the deployment template for your own server. It includes HTTPS redirection, TLS 1.2/1.3, security headers, extensionless routes such as `/commit`, safe static asset caching, and 404 handling. Fill in the certificate paths and website directory, then run `nginx -t` to validate it.

### Method 2: Vercel Deployment (Recommended)

Vercel provides free static website hosting with simple and fast deployment.

#### Option 1: Via Vercel Dashboard (Easiest)

1. Visit [Vercel](https://vercel.com) and sign up/login

2. Click "Add New Project"

3. Import your GitHub repository
   - Select "Import Git Repository"
   - Authorize GitHub and select `web_tool` repository

4. Configure project
   - Framework Preset: Select "Other"
   - Root Directory: `./` (keep default)
   - Build Command: Leave empty
   - Output Directory: `./` (keep default)

5. Click "Deploy" and wait for completion

6. After successful deployment, you'll get a domain like: `your-project.vercel.app`

#### Option 2: Via Vercel CLI

1. Install Vercel CLI

```bash
npm install -g vercel
```

2. Login to Vercel

```bash
vercel login
```

3. Deploy from project directory

```bash
cd web_tool
vercel
```

4. Follow the prompts
   - Set up and deploy? Y
   - Which scope? Select your account
   - Link to existing project? N
   - Project name? web_tool (or custom name)
   - In which directory is your code located? ./

5. Production deployment

```bash
vercel --prod
```

#### Custom Domain (Optional)

1. Open your project in Vercel Dashboard

2. Go to "Settings" -> "Domains"

3. Add your custom domain

4. Follow instructions to add DNS records at your domain registrar

#### Vercel Configuration

The checked-in `vercel.json` is the source of truth for security headers, extensionless routes, and safe asset caching. Keep it in the project root and update the file itself when deployment behavior needs to change.

### Method 3: Other Deployment Platforms

#### GitHub Pages

1. Enable Pages in GitHub repository settings
2. Select branch and directory (usually `main` branch and `/` root)
3. Save and auto-deploy

#### Cloudflare Pages

1. Login to Cloudflare Dashboard
2. Go to Pages and create new project
3. Connect GitHub repository
4. Configure build settings (leave empty)
5. Click deploy

#### Netlify

1. Login to Netlify
2. Click "Add new site" -> "Import an existing project"
3. Select Git repository
4. Leave build command and publish directory empty
5. Click "Deploy site"

## Customization

### Modify Navigation Links

Maintain navigation data in `data/sites.json` instead of editing the generated cards in `index.html`. After changing the catalog, run:

```bash
node scripts/build-catalog.mjs
node scripts/validate-catalog.mjs
```

The build script synchronizes homepage cards and submission categories. Put website icons in `assets/images/logos/` and reference them through each entry's `image` field.

Prefer HTTPS URLs. Set `"allowInsecure": true` only when a reviewed site does not support HTTPS and must remain available, then add the exact URL to the approved list in `scripts/validate-catalog.mjs`. The homepage labels these cards as HTTP so users do not mistake them for encrypted connections.

### Modify About Page

Edit `about/index.html` file to update personal information and contact details.

### Modify Submission Page

The form markup is in `commit.html`, browser logic is in `assets/js/commit-page.js`, and the email API is in `api/submit.js`. Run `node scripts/validate-submit-api.mjs` after making changes.

### Custom Styles

Main style files are in `assets/css/` directory:

- `custom-style.css` - Custom styles
- `theme-subset.css` - Purged theme styles used by the homepage

### Add New Categories

Add categories and sites to the `categories` array in `data/sites.json`, then rebuild and validate the catalog:

```bash
node scripts/build-catalog.mjs
node scripts/validate-catalog.mjs
```

## Project Structure

```
web_tool/
├── index.html              # Homepage
├── commit.html             # URL submission page
├── 404.html               # 404 error page
├── about/
│   └── index.html         # About page
├── assets/
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   ├── images/            # Image resources
│   └── fontawesome-5.15.4/ # Icon library
├── data/
│   └── sites.json         # Navigation catalog source
├── scripts/               # Build and validation scripts
├── README.md              # Documentation (Chinese)
├── Readme-en.md           # Documentation (English)
└── vercel.json            # Vercel config (optional)
```

## FAQ

### 1. Images or Styles Not Loading

Check if resource paths are correct and ensure relative paths are accurate.

### 2. How to Implement Backend for Submission

The project includes an optional Vercel email endpoint. With Resend configured, requests are submitted online; otherwise the page offers an email-client fallback. Submission details are not persisted in the browser. For backend review and persistent storage:
- Use Vercel Serverless Functions
- Configure backend API (Node.js, Python, PHP, etc.)
- Use third-party form services (Formspree, Typeform, etc.)

### 3. How to Add Analytics

Integrate analytics tools:
- Google Analytics
- Baidu Analytics

### 4. How to Optimize SEO

- Complete meta tags (title, description, keywords)
- Add sitemap.xml
- Submit to search engines
- Optimize page load speed

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (no jQuery dependency)
- Bootstrap 4
- Font Awesome 5

## References

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Let's Encrypt](https://letsencrypt.org/)

## License

MIT License

## Contributing

Issues and Pull Requests are welcome!

## Contact

- GitHub: https://github.com/hadis112233
- Email: wwd118932@gmail.com

---

⭐ If this project helps you, please give it a Star!
