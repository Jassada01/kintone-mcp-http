# HTTP Transport Usage Guide

This document describes how to use the HTTP transport version of the Kintone MCP Server.

## Quick Start

### Using npm package
```bash
# Install globally
npm install -g @kintone/mcp-server

# Start HTTP server
kintone-mcp-server-http \
  --base-url https://example.cybozu.com \
  --username your-username \
  --password your-password \
  --port 3000 \
  --host localhost
```

### Using Docker
```bash
# Build and run
docker build -f docker/Dockerfile.http -t kintone-mcp-http .
docker run -p 3000:3000 \
  -e KINTONE_BASE_URL=https://example.cybozu.com \
  -e KINTONE_USERNAME=your-username \
  -e KINTONE_PASSWORD=your-password \
  kintone-mcp-http
```

### Using Docker Compose
```bash
# Create .env file
cat << EOF > .env
KINTONE_BASE_URL=https://example.cybozu.com
KINTONE_USERNAME=your-username
KINTONE_PASSWORD=your-password
PORT=3000
EOF

# Start services
docker-compose -f docker-compose.http.yml up -d
```

## Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3000` |
| `HOST` | HTTP server host | `localhost` |
| `CORS_ORIGIN` | CORS origin pattern | `http://localhost:*` |

### Command Line Options
```bash
kintone-mcp-server-http --help

Options:
  --port <number>           Server port (default: 3000)
  --host <string>          Server host (default: localhost)  
  --cors-origin <pattern>  CORS origin pattern
```

## Client Configuration

### MCP Client (.mcp.json)
```json
{
  "mcpServers": {
    "kintone": {
      "type": "http",
      "url": "http://localhost:3000/mcp",
      "headers": {
        "User-Agent": "my-mcp-client/1.0.0"
      }
    }
  }
}
```

### Cursor (.cursor/mcp.json)
```json
{
  "mcpServers": {
    "kintone": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

## API Endpoints

### MCP Endpoint
- **URL**: `http://localhost:3000/mcp`
- **Methods**: `POST`, `GET`
- **Content-Type**: `application/json`
- **Response**: JSON-RPC messages or Server-Sent Events

### Health Check
```bash
curl http://localhost:3000/mcp
```

## Security Considerations

### Origin Validation
The server validates the `Origin` header to prevent DNS rebinding attacks:
```javascript
// Suspicious origins are logged
console.warn(`Suspicious origin: ${origin}`);
```

### Localhost Binding
By default, the server binds to `localhost` only:
```bash
# Secure (default)
HOST=localhost

# Less secure - exposes to network
HOST=0.0.0.0
```

### CORS Configuration
Configure CORS origins for web clients:
```bash
# Allow specific origins
CORS_ORIGIN=https://myapp.example.com

# Allow localhost with any port (default)
CORS_ORIGIN=http://localhost:*

# Allow multiple origins (not recommended)
CORS_ORIGIN=*
```

## Development

### Local Development
```bash
# Start HTTP server in development mode
pnpm dev:http

# Server will restart on file changes
# Available at http://localhost:3000/mcp
```

### Testing HTTP Transport
```bash
# Test with curl
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Expected response: List of available tools
```

## Production Deployment

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
CORS_ORIGIN=https://yourapp.example.com

# Kintone configuration
KINTONE_BASE_URL=https://yourcompany.cybozu.com
KINTONE_API_TOKEN=your-api-token-here
```

### Docker Production
```yaml
# docker-compose.prod.yml
services:
  kintone-mcp-http:
    image: ghcr.io/kintone/mcp-server:http-latest
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      HOST: 0.0.0.0
      CORS_ORIGIN: https://yourapp.example.com
      KINTONE_BASE_URL: https://yourcompany.cybozu.com
      KINTONE_API_TOKEN: ${KINTONE_API_TOKEN}
    restart: unless-stopped
```

### Reverse Proxy Setup (Nginx)
```nginx
server {
    listen 80;
    server_name mcp.yourcompany.com;
    
    location /mcp {
        proxy_pass http://localhost:3000/mcp;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000

# Use different port
PORT=3001 kintone-mcp-server-http
```

#### CORS Errors
```bash
# Check CORS configuration
CORS_ORIGIN=http://localhost:* kintone-mcp-server-http

# Or allow all origins (not recommended)
CORS_ORIGIN=* kintone-mcp-server-http
```

#### Connection Refused
```bash
# Ensure server is running
curl http://localhost:3000/mcp

# Check server logs
docker logs <container-id>
```

### Debugging
```bash
# Enable debug logging
DEBUG=* kintone-mcp-server-http

# Check server status
curl -v http://localhost:3000/mcp
```