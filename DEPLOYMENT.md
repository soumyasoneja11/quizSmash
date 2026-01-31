# Deployment Guide for QuizSmash

## Local Development (Already Running!)

✅ **Backend**: Running on http://localhost:5000
✅ **Frontend**: Running on http://localhost:5173

### To Run Locally Again
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend  
cd frontend && npm run dev

# Open browser
http://localhost:5173
```

## Deployment Options

### Option 1: Azure App Service (Recommended for Hackathon)

#### Prerequisites
- Azure account (free tier available)
- Azure CLI installed
- Git repository pushed to GitHub

#### Deployment Steps

**Step 1: Create Azure resources**
```bash
# Create resource group
az group create --name quizsmash-rg --location eastus

# Create App Service plan
az appservice plan create \
  --name quizsmash-plan \
  --resource-group quizsmash-rg \
  --sku F1 \
  --is-linux

# Create backend app
az webapp create \
  --resource-group quizsmash-rg \
  --plan quizsmash-plan \
  --name quizsmash-api \
  --runtime "NODE|20-lts"

# Create static web app for frontend
az staticwebapp create \
  --name quizsmash-web \
  --resource-group quizsmash-rg \
  --source https://github.com/YOUR_USERNAME/quizSmash \
  --location eastus \
  --branch main \
  --app-location frontend \
  --build-output-location dist
```

**Step 2: Configure environment variables**
```bash
# Backend environment variables
az webapp config appsettings set \
  --resource-group quizsmash-rg \
  --name quizsmash-api \
  --settings \
    PORT=80 \
    FRONTEND_URL=https://quizsmash-web.azurestaticapps.net \
    SQLITE_PATH=/home/site/wwwroot/data/quizsmash.sqlite \
    OPENAI_API_KEY=$OPENAI_API_KEY
```

**Step 3: Deploy backend**
```bash
cd backend
npm run build  # or npm start for production
az webapp deployment source config-zip \
  --resource-group quizsmash-rg \
  --name quizsmash-api \
  --src backend.zip
```

**Step 4: Configure frontend**

Update `frontend/.env.production`:
```env
VITE_API_URL=https://quizsmash-api.azurewebsites.net
VITE_SOCKET_URL=https://quizsmash-api.azurewebsites.net
```

Frontend deploys automatically from GitHub via Static Web App workflow.

### Option 2: Vercel (Fastest for Frontend)

**Frontend on Vercel**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from frontend directory
cd frontend
vercel

# Follow prompts to connect GitHub account
# Vercel will auto-detect Next.js/Vite and build
```

Set environment variables in Vercel dashboard:
- `VITE_API_URL=https://your-backend-url`
- `VITE_SOCKET_URL=https://your-backend-url`

### Option 3: Heroku (Deprecated but still works)

```bash
# Install Heroku CLI
# Create app
heroku create quizsmash-api

# Set environment variables
heroku config:set PORT=80
heroku config:set OPENAI_API_KEY=$OPENAI_API_KEY
heroku config:set FRONTEND_URL=your-frontend-url

# Deploy
git push heroku main
```

### Option 4: Docker + Any Cloud Provider

**Dockerfile for Backend**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --production

# Copy source code
COPY backend/src ./src

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["node", "src/index.js"]
```

**Docker Compose (for local testing)**
```yaml
version: '3.8'
services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "5000:5000"
    environment:
      PORT: 5000
      FRONTEND_URL: http://localhost:5173
      SQLITE_PATH: /app/data/quizsmash.sqlite
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    volumes:
      - ./backend/data:/app/data

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:5000
      VITE_SOCKET_URL: http://localhost:5000
```

**Docker Compose Frontend (Dockerfile)**
```dockerfile
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Option 5: AWS EC2 (More Control)

```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Install Node.js
curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone your-repo-url
cd quizSmash

# Install & run
cd backend && npm install
nohup npm start > server.log 2>&1 &

cd ../frontend && npm install
npm run build

# Serve frontend with Nginx
sudo apt-get install nginx
sudo cp dist/* /var/www/html/
sudo systemctl restart nginx
```

## Production Checklist

- [ ] **Security**
  - [ ] HTTPS enabled (SSL certificate)
  - [ ] CORS configured for production domain
  - [ ] API key not in code (use env vars)
  - [ ] Database backups enabled
  - [ ] Rate limiting implemented (if public)

- [ ] **Performance**
  - [ ] Frontend built & minified (`npm run build`)
  - [ ] Backend running in production mode
  - [ ] CDN configured for static assets
  - [ ] Database indexed on common queries
  - [ ] Caching headers configured

- [ ] **Monitoring**
  - [ ] Error logging enabled
  - [ ] Application insights/monitoring set up
  - [ ] Uptime monitoring configured
  - [ ] Database backups scheduled
  - [ ] Alerts for critical errors

- [ ] **Configuration**
  - [ ] Environment variables set in deployment
  - [ ] Database path is persistent storage
  - [ ] OpenAI API key configured
  - [ ] FRONTEND_URL matches deployment
  - [ ] Port configured correctly

## Environment Variables Reference

### Backend (.env)
```env
# Server
PORT=80                                          # Production: 80, Local: 5000
FRONTEND_URL=https://your-domain.com             # Frontend URL for CORS

# Database
SQLITE_PATH=/persistent/path/quizsmash.sqlite   # Must be writable
NODE_ENV=production                             # Optional: production/development

# AI
OPENAI_API_KEY=sk_live_your_key_here            # Get from https://platform.openai.com
```

### Frontend (.env.production)
```env
VITE_API_URL=https://your-api-domain.com
VITE_SOCKET_URL=https://your-api-domain.com
```

## Scaling Considerations

### Current Limitations (SQLite)
- Single server architecture
- ~100-200 concurrent users max
- No horizontal scaling

### For High Scale (1000+ users)
1. **Database**: Migrate to PostgreSQL
   ```javascript
   // Replace SQLite with pg in database.js
   const { Pool } = require('pg');
   const pool = new Pool({...});
   ```

2. **Horizontal Scaling**: Use sticky sessions
   ```javascript
   const io = new Server(server, {
     adapter: require("socket.io-redis")({...})
   });
   ```

3. **Load Balancing**: Nginx/HAProxy
4. **Caching**: Redis for room cache
5. **CDN**: CloudFront/Azure CDN for frontend

## Monitoring & Logs

### Azure App Service
```bash
# Stream logs
az webapp log tail --name quizsmash-api --resource-group quizsmash-rg

# View logs in portal
# https://portal.azure.com → App Services → quizsmash-api → Log Stream
```

### Docker Logs
```bash
docker logs -f quizsmash-backend
docker logs -f quizsmash-frontend
```

### PM2 (Process Manager)
```bash
# Install
npm install -g pm2

# Start backend
pm2 start "npm start" --name quizsmash-api

# Monitor
pm2 monit

# View logs
pm2 logs quizsmash-api
```

## Disaster Recovery

### Database Backup (SQLite)
```bash
# Backup script
cp /path/to/quizsmash.sqlite /backups/quizsmash-$(date +%Y%m%d).sqlite

# Automated backup (cron)
0 2 * * * cp /path/to/quizsmash.sqlite /backups/quizsmash-$(date +\%Y\%m\%d).sqlite
```

### Restore from Backup
```bash
# Stop server
npm stop

# Restore database
cp /backups/quizsmash-2026-01-31.sqlite /path/to/quizsmash.sqlite

# Start server
npm start
```

## Cost Estimation

| Service | Free Tier | Usage | Monthly Cost |
|---------|-----------|-------|--------------|
| Azure App Service | 1 F1 | Unlimited* | $0 |
| Azure Static Web App | 1 | 100GB bandwidth | $0 |
| Azure Cosmos DB | 400 RU/s | - | $24 |
| Vercel | 100GB | Included | $0 |
| Heroku | Removed | - | $7+ |
| AWS EC2 | 1 t2.micro | 12 months | $0 (1yr) |

*F1 limited to 60 min/day. Use B1 Standard ($11/mo) for always-on.

## Rollback Plan

If deployment fails:
```bash
# Revert to previous version
git revert HEAD
git push

# Or use blue-green deployment
# Keep previous version running, deploy to new instance, switch traffic
```

## Support

Deploy trouble? Check:
1. All environment variables set correctly
2. Database path is writable
3. OpenAI API key valid (if using AI)
4. Ports not blocked by firewall
5. Frontend can reach backend URL
6. Both HTTPS or both HTTP (mixed causes CORS issues)

Good luck launching! 🚀
