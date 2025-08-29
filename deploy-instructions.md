# 🚀 Production Deployment Instructions (No Domain Required)

## Prerequisites on Server

```bash
# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt update
sudo apt install docker-compose-plugin
```

## Deployment Steps

### 1. Clone Repository
```bash
git clone https://github.com/Jassada01/kintone-mcp-http.git
cd kintone-mcp-http
```

### 2. Create Environment File
```bash
cat << EOF > .env
KINTONE_BASE_URL=https://isth-demo.kintone.com/
KINTONE_USERNAME=Jassadaporn@kintone.com
KINTONE_PASSWORD=Caster@2020
NODE_ENV=production
EOF
```

### 3. Deploy with nginx Reverse Proxy
```bash
# Start services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### 4. Configure Firewall
```bash
# Ubuntu/Debian
sudo ufw allow 80
sudo ufw allow 22  # Keep SSH access
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --reload
```

## Testing

### From Server
```bash
# Health check
curl http://localhost/health

# API info
curl http://localhost/api/info

# MCP endpoint test
curl -X POST http://localhost/mcp \
  -H "Accept: application/json, text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{}}}'
```

### From External
```bash
# Replace YOUR_SERVER_IP with actual IP
curl http://YOUR_SERVER_IP/health
curl http://YOUR_SERVER_IP/api/info
```

## Endpoints Available

| Endpoint    | Method | Description                    |
|-------------|--------|--------------------------------|
| `/`         | GET    | Basic server info              |
| `/health`   | GET    | Health check                   |
| `/mcp`      | POST   | MCP JSON-RPC requests          |
| `/mcp`      | GET    | Server-Sent Events stream      |
| `/mcp`      | DELETE | Session termination            |
| `/api/info` | GET    | API information                |

## Usage in n8n

1. Add MCP Client node
2. Set endpoint URL: `http://YOUR_SERVER_IP/mcp`
3. Use in your workflows!

## Maintenance Commands

```bash
# View logs
docker-compose -f docker-compose.production.yml logs -f

# Restart services
docker-compose -f docker-compose.production.yml restart

# Update deployment
git pull
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build

# Stop services
docker-compose -f docker-compose.production.yml down
```

## Security Notes

- Server binds to all interfaces (0.0.0.0) but nginx proxies safely
- CORS is configured to allow all origins for API access
- Rate limiting is enabled (10 requests/second for API, 5 for health)
- Security headers are added automatically
- Services run with resource limits

## Troubleshooting

**Port 80 already in use:**
```bash
sudo netstat -tlnp | grep :80
sudo systemctl stop apache2  # or nginx if running
```

**Permission denied:**
```bash
sudo docker-compose -f docker-compose.production.yml up -d
```

**Check if services are running:**
```bash
docker ps
docker logs <container_name>
```