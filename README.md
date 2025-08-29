# Kintone MCP Server with HTTP Transport

[![License: MIT][license-badge]][license-url]

[license-badge]: https://img.shields.io/badge/License-Apache_2.0-blue.svg
[license-url]: LICENSE

**English** | [ไทย](README_th.md)

Official Kintone MCP Server with HTTP Transport support for remote API access. This project is based on the original [kintone/mcp-server](https://github.com/kintone/mcp-server) with added HTTP transport capabilities for integration with tools like n8n, web applications, and remote AI systems.

## Features

- **HTTP Transport**: Access Kintone MCP tools via HTTP REST API endpoints
- **Stdio Transport**: Traditional MCP stdio communication for direct AI integration
- **Production Ready**: Docker deployment with nginx reverse proxy support
- **Security**: CORS configuration, rate limiting, and secure headers
- **Real-time Streaming**: Server-Sent Events (SSE) support for real-time updates
- **Session Management**: Stateful session handling for complex workflows

## Quick Start

### HTTP Server (Recommended for Remote Access)

1. **Clone Repository**
```bash
git clone https://github.com/Jassada01/kintone-mcp-http.git
cd kintone-mcp-http
```

2. **Create Environment File**
```bash
cat << EOF > .env
KINTONE_BASE_URL=https://your-company.cybozu.com
KINTONE_USERNAME=your-username
KINTONE_PASSWORD=your-password
NODE_ENV=production
EOF
```

3. **Start HTTP Server**
```bash
# Using Docker Compose (Recommended)
docker-compose -f docker-compose.http.yml up -d

# Or using Docker directly
docker build -f docker/Dockerfile.http -t kintone-mcp-http .
docker run -d -p 3000:3000 --env-file .env kintone-mcp-http

# Or using Node.js directly
pnpm install
pnpm build
pnpm start:http
```

4. **Test Connection**
```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/api/info

# MCP initialize request
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{}}}'
```

### Traditional Stdio Transport

```bash
# Using Docker
docker run -i --rm \
  -e KINTONE_BASE_URL=https://your-company.cybozu.com \
  -e KINTONE_USERNAME=your-username \
  -e KINTONE_PASSWORD=your-password \
  kintone-mcp-http

# Using Node.js
pnpm start -- --base-url https://your-company.cybozu.com --username your-username --password your-password
```

## HTTP API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Basic server information |
| `/health` | GET | Health check endpoint |
| `/api/info` | GET | API information and available endpoints |
| `/mcp` | POST | MCP JSON-RPC requests |
| `/mcp` | GET | Server-Sent Events stream for real-time updates |
| `/mcp` | DELETE | Session termination |

## Integration Examples

### n8n Integration

1. Add HTTP Request node
2. Set URL: `http://your-server:3000/mcp`
3. Method: POST
4. Headers: `Content-Type: application/json`
5. Body: MCP JSON-RPC format

Example n8n payload:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "kintone-get-apps",
    "arguments": {}
  }
}
```

### Web Application Integration

```javascript
// Initialize MCP session
const initResponse = await fetch('http://your-server:3000/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-03-26',
      capabilities: {}
    }
  })
});

const { headers } = initResponse;
const sessionId = headers.get('Mcp-Session-Id');

// Call Kintone tools
const toolResponse = await fetch('http://your-server:3000/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Mcp-Session-Id': sessionId
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'kintone-get-apps',
      arguments: {}
    }
  })
});
```

## Production Deployment

### Simple HTTP Server (Port 3000)

```bash
# Create environment file
cat << EOF > .env
KINTONE_BASE_URL=https://your-company.cybozu.com
KINTONE_USERNAME=your-username
KINTONE_PASSWORD=your-password
NODE_ENV=production
EOF

# Start server
docker-compose -f docker-compose.http.yml up -d

# Access via: http://your-server-ip:3000/mcp
```

### Production with nginx Reverse Proxy (Port 80)

```bash
# Start with nginx proxy
docker-compose -f docker-compose.production.yml up -d

# Access via: http://your-server-ip/mcp
```

The nginx setup provides:
- Rate limiting (10 req/s for API, 5 req/s for health)
- Security headers
- CORS configuration
- Load balancing support

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `KINTONE_BASE_URL` | Kintone environment URL (e.g., `https://example.cybozu.com`) | ✓ |
| `KINTONE_USERNAME` | Kintone login username | ※1 |
| `KINTONE_PASSWORD` | Kintone login password | ※1 |
| `KINTONE_API_TOKEN` | API token (comma-separated, up to 9 tokens) | ※1 |
| `KINTONE_BASIC_AUTH_USERNAME` | Basic authentication username | - |
| `KINTONE_BASIC_AUTH_PASSWORD` | Basic authentication password | - |
| `HTTPS_PROXY` | HTTPS proxy URL | - |
| `PORT` | HTTP server port (default: 3000) | - |
| `HOST` | HTTP server host (default: localhost) | - |
| `CORS_ORIGIN` | CORS origin pattern (default: http://localhost:*) | - |

※1: Either `KINTONE_USERNAME` & `KINTONE_PASSWORD` or `KINTONE_API_TOKEN` is required

### Command Line Options

```bash
# HTTP server options
pnpm start:http --port 3000 --host 0.0.0.0 --cors-origin "*"

# Stdio server options  
pnpm start --base-url https://example.cybozu.com --username user --password pass
```

## Available Tools

| Tool Name | Description |
|-----------|-------------|
| `kintone-get-apps` | Get multiple app settings |
| `kintone-get-app` | Get single app details |
| `kintone-get-form-fields` | Get app field configuration |
| `kintone-get-process-management` | Get process management settings |
| `kintone-get-records` | Get multiple records |
| `kintone-add-records` | Add multiple records |
| `kintone-update-records` | Update multiple records |
| `kintone-delete-records` | Delete multiple records |
| `kintone-update-statuses` | Update multiple record statuses |

## Development

### Prerequisites

- Node.js >= 22
- pnpm 10.15.0+
- Docker (for containerized deployment)

### Setup

```bash
# Clone repository
git clone https://github.com/Jassada01/kintone-mcp-http.git
cd kintone-mcp-http

# Install dependencies
pnpm install

# Build project
pnpm build

# Run tests
pnpm test

# Start development server
pnpm dev:http  # HTTP transport
pnpm dev       # Stdio transport
```

### Project Structure

```
src/
├── index.ts              # Stdio transport entry point
├── http-server.ts        # HTTP transport entry point  
├── server.ts             # MCP server configuration
├── client.ts             # Kintone client management
├── config/               # Configuration and validation
├── tools/                # MCP tool implementations
│   └── kintone/          # Kintone-specific tools
└── __tests__/            # Test files
```

## Limitations

### Record Operations
- **File Attachments**: Attachment fields cannot be specified in record operations
- **Selection Fields**: User/Organization/Group selection fields only work with predefined options

### Other Limitations
- **Guest Spaces**: Guest space applications are not supported
- **Test Environments**: App testing environments are not accessible

## Original Project

This project is based on the official [kintone/mcp-server](https://github.com/kintone/mcp-server) with the following enhancements:

- Added HTTP transport support for remote API access
- Implemented Server-Sent Events (SSE) for real-time streaming  
- Added session management for stateful interactions
- Created production deployment configurations
- Enhanced error logging and debugging capabilities

## License

Copyright 2025 Cybozu, Inc.

Licensed under the [Apache 2.0](LICENSE).

---

**Note**: This is an enhanced version of the original kintone MCP server. For the official version, please visit [kintone/mcp-server](https://github.com/kintone/mcp-server).