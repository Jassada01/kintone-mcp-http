# Kintone MCP Server with HTTP Transport

[![License: Apache 2.0][license-badge]][license-url]
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org/)
[![MCP Protocol](https://img.shields.io/badge/MCP-2025--03--26-blue)](https://modelcontextprotocol.io/)

[license-badge]: https://img.shields.io/badge/License-Apache_2.0-blue.svg
[license-url]: LICENSE

[日本語](README.md) | English

Enhanced MCP server for Kintone with **HTTP transport support** - Connect your AI workflows via REST API endpoints with both stdio and HTTP transports.

## 🚀 Key Features

- **🔌 Dual Transport Support**: Both stdio and HTTP endpoints
- **🌐 HTTP REST API**: Connect from web applications, n8n, and other HTTP clients
- **📡 Server-Sent Events**: Real-time streaming with SSE support
- **🔒 Security First**: CORS protection, DNS rebinding prevention, origin validation
- **🎯 Session Management**: UUID-based sessions with resumability
- **📊 Health Monitoring**: Built-in health check endpoint
- **🐳 Docker Ready**: Full Docker and Docker Compose support
- **🔧 Environment Config**: dotenv support for easy configuration

## 🌟 What's New

This enhanced version adds **HTTP transport support** to the original Kintone MCP server, enabling:

- **REST API Integration**: Connect from any HTTP client
- **n8n Workflows**: Direct integration with n8n automation platform
- **Web Applications**: Frontend applications can communicate via HTTP
- **Load Balancing**: Deploy multiple instances behind a load balancer
- **Cloud Deployment**: Deploy to any cloud platform with HTTP support

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [HTTP Transport Usage](#http-transport-usage)
- [Installation Methods](#installation-methods)
- [Configuration](#configuration)
- [Available Tools](#available-tools)
- [Development](#development)
- [Docker Deployment](#docker-deployment)
- [Security](#security)
- [API Documentation](#api-documentation)
- [Limitations](#limitations)
- [License](#license)

## 🚀 Quick Start

### Option 1: HTTP Server (Recommended)

```bash
# Clone the repository
git clone https://github.com/Jassada01/kintone-mcp-http.git
cd kintone-mcp-http

# Install dependencies
pnpm install

# Create environment file
cat << EOF > .env
KINTONE_BASE_URL=https://your-company.cybozu.com
KINTONE_USERNAME=your-username
KINTONE_PASSWORD=your-password
PORT=3000
HOST=127.0.0.1
EOF

# Start HTTP server
pnpm dev:http
```

**🎉 Your MCP server is now running at `http://127.0.0.1:3000/mcp`**

### Option 2: Docker (Production Ready)

```bash
# Using Docker Compose
docker-compose -f docker-compose.http.yml up -d

# Or using Docker directly
docker run -p 3000:3000 \
  -e KINTONE_BASE_URL=https://your-company.cybozu.com \
  -e KINTONE_USERNAME=your-username \
  -e KINTONE_PASSWORD=your-password \
  ghcr.io/your-repo/kintone-mcp-http:latest
```

## 🌐 HTTP Transport Usage

### For n8n Workflows

1. Add **MCP Client** node to your workflow
2. Set endpoint URL: `http://127.0.0.1:3000/mcp`
3. Configure your Kintone credentials in environment variables
4. Start using Kintone tools in your AI workflows!

### For Web Applications

```javascript
// Initialize MCP connection
const response = await fetch('http://127.0.0.1:3000/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream'
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-03-26',
      capabilities: { tools: {} },
      clientInfo: { name: 'my-app', version: '1.0.0' }
    }
  })
});

// Get available tools
const toolsResponse = await fetch('http://127.0.0.1:3000/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'Mcp-Session-Id': sessionId // From initialize response
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  })
});
```

### Health Check

```bash
curl http://127.0.0.1:3000/health
# Returns: {"status":"ok","timestamp":"2025-01-01T00:00:00.000Z","sessions":0}
```

## 📦 Installation Methods

### Method 1: From Source (Recommended for Development)

```bash
git clone https://github.com/Jassada01/kintone-mcp-http.git
cd kintone-mcp-http
pnpm install
```

### Method 2: npm Package (Coming Soon)

```bash
npm install -g kintone-mcp-server-http
```

### Method 3: Docker

```bash
# Pull image
docker pull ghcr.io/your-repo/kintone-mcp-http:latest

# Run container
docker run -p 3000:3000 \
  -e KINTONE_BASE_URL=https://your-company.cybozu.com \
  -e KINTONE_USERNAME=your-username \
  -e KINTONE_PASSWORD=your-password \
  ghcr.io/your-repo/kintone-mcp-http:latest
```

## Usage

If you installed the DXT file, no additional steps are required to use it.
For other installation methods, you need to create a configuration file.

Please refer to the documentation of the AI tool you are using for details on how to create the configuration file.

### Example Configuration File Path

- Claude Code: `.mcp.json` \[[ref](https://docs.anthropic.com/en/docs/claude-code/mcp)]
- Cursor: `.cursor/mcp.json` \[[ref](https://docs.cursor.com/en/context/mcp)]

### Example Configuration File Content

```json
{
  "mcpServers": {
    "kintone": {
      "type": "stdio",
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "KINTONE_BASE_URL",
        "-e",
        "KINTONE_USERNAME",
        "-e",
        "KINTONE_PASSWORD",
        "ghcr.io/kintone/mcp-server:latest"
      ],
      "cwd": "${cwd}",
      "env": {
        "KINTONE_BASE_URL": "https://example.cybozu.com",
        "KINTONE_USERNAME": "username",
        "KINTONE_PASSWORD": "password"
      }
    }
  }
}
```

## ⚙️ Configuration

### Environment Variables

| Variable                      | Description                                                               | Default     | Required |
| ----------------------------- | ------------------------------------------------------------------------- | ----------- | -------- |
| `KINTONE_BASE_URL`            | Base URL of your Kintone environment (e.g., `https://example.cybozu.com`) | -           | ✓        |
| `KINTONE_USERNAME`            | Kintone login username                                                    | -           | ※1       |
| `KINTONE_PASSWORD`            | Kintone login password                                                    | -           | ※1       |
| `KINTONE_API_TOKEN`           | API token (comma-separated, max 9 tokens)                                 | -           | ※1       |
| `KINTONE_BASIC_AUTH_USERNAME` | Basic authentication username                                             | -           | -        |
| `KINTONE_BASIC_AUTH_PASSWORD` | Basic authentication password                                             | -           | -        |
| `KINTONE_PFX_FILE_PATH`       | Path to PFX file (for client certificate authentication)                  | -           | -        |
| `KINTONE_PFX_FILE_PASSWORD`   | PFX file password                                                         | -           | -        |
| `HTTPS_PROXY`                 | HTTPS proxy URL (e.g., `http://proxy.example.com:8080`)                   | -           | -        |
| `PORT`                        | HTTP server port                                                          | `3000`      | -        |
| `HOST`                        | HTTP server host                                                          | `localhost` | -        |
| `CORS_ORIGIN`                 | CORS origin pattern                                                       | `http://localhost:*` | -        |

### Command Line Arguments

All environment variables can also be specified as command-line arguments:

```bash
# HTTP server
kintone-mcp-server-http \
  --base-url https://your-company.cybozu.com \
  --username your-username \
  --password your-password \
  --port 3000 \
  --host 127.0.0.1 \
  --cors-origin "http://localhost:*"

# Stdio server (original)
kintone-mcp-server \
  --base-url https://your-company.cybozu.com \
  --username your-username \
  --password your-password
```

### Configuration Priority

1. **Command-line arguments** (highest priority)
2. **Environment variables**
3. **dotenv (.env file)**

※1: Either `KINTONE_USERNAME` & `KINTONE_PASSWORD` or `KINTONE_API_TOKEN` is required

**Notes:**

- When using client certificate authentication, the URL domain must be `.s.cybozu.com` (e.g., `https://example.s.cybozu.com`)
- When password authentication and API token authentication are specified simultaneously, password authentication takes priority
- When both command-line arguments and environment variables are specified, command-line arguments take priority
- For detailed authentication configuration, refer to the [Authentication Configuration Guide](./docs/en/authentication.md)

### Proxy Configuration

If you need to connect through a proxy server in corporate environments, set the `HTTPS_PROXY` environment variable.

```bash
export HTTPS_PROXY="http://proxy.example.com:8080"

# If authentication is required
export HTTPS_PROXY="http://username:password@proxy.example.com:8080"
```

## 🛠️ Available Tools

This server provides **9 powerful tools** for Kintone integration:

### 📱 App Management Tools

| Tool Name                        | Description                       | Use Case                          |
| -------------------------------- | --------------------------------- | --------------------------------- |
| `kintone-get-apps`               | Get information of multiple apps  | List all accessible apps         |
| `kintone-get-app`                | Get details of a single app       | Get specific app information      |
| `kintone-get-form-fields`        | Get app field settings            | Discover available fields/schema  |
| `kintone-get-process-management` | Get process management settings   | Understand workflow configuration |

### 📊 Record Management Tools

| Tool Name                        | Description                       | Use Case                          |
| -------------------------------- | --------------------------------- | --------------------------------- |
| `kintone-get-records`            | Get multiple records              | Query and retrieve data           |
| `kintone-add-records`            | Add multiple records              | Create new entries (bulk)         |
| `kintone-update-records`         | Update multiple records           | Modify existing data (bulk)       |
| `kintone-delete-records`         | Delete multiple records           | Remove entries (bulk)             |
| `kintone-update-statuses`        | Update status of multiple records | Manage workflow states            |

### 💡 Example Usage in AI Workflows

```javascript
// Get app information first
{
  "method": "tools/call",
  "params": {
    "name": "kintone-get-app",
    "arguments": { "appId": "123" }
  }
}

// Then get records from that app
{
  "method": "tools/call", 
  "params": {
    "name": "kintone-get-records",
    "arguments": {
      "app": "123",
      "limit": 10
    }
  }
}
```

## 🔧 Development

### Available Scripts

```bash
# HTTP Transport (recommended)
pnpm dev:http         # Start HTTP development server with watch mode
pnpm start:http       # Start HTTP production server

# Stdio Transport (original)
pnpm dev              # Start stdio development server with watch mode
pnpm start            # Start stdio production server

# Build & Test
pnpm build            # Compile TypeScript to dist/
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage

# Code Quality
pnpm lint             # Run ESLint
pnpm typecheck        # Run TypeScript type checking
pnpm fix              # Fix all auto-fixable issues
```

### Adding New Tools

1. Create tool file in `src/tools/kintone/`
2. Use `createTool()` helper function
3. Add to `src/tools/index.ts` tools array
4. Follow the existing pattern for consistency

### Testing

```bash
# Unit tests
pnpm test

# Integration tests with real Kintone
KINTONE_BASE_URL=https://test.cybozu.com \
KINTONE_USERNAME=testuser \
KINTONE_PASSWORD=testpass \
pnpm test:integration
```

## 🐳 Docker Deployment

### Production Deployment

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  kintone-mcp-http:
    image: ghcr.io/your-repo/kintone-mcp-http:latest
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      HOST: 0.0.0.0
      PORT: 3000
      KINTONE_BASE_URL: https://your-company.cybozu.com
      KINTONE_API_TOKEN: ${KINTONE_API_TOKEN}
      CORS_ORIGIN: https://your-app.example.com
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kintone-mcp-http
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kintone-mcp-http
  template:
    metadata:
      labels:
        app: kintone-mcp-http
    spec:
      containers:
      - name: kintone-mcp-http
        image: ghcr.io/your-repo/kintone-mcp-http:latest
        ports:
        - containerPort: 3000
        env:
        - name: KINTONE_BASE_URL
          value: "https://your-company.cybozu.com"
        - name: KINTONE_API_TOKEN
          valueFrom:
            secretKeyRef:
              name: kintone-secrets
              key: api-token
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

## 🔒 Security

### Production Security Checklist

- ✅ **Environment Variables**: Never commit credentials to Git
- ✅ **HTTPS Only**: Use HTTPS in production environments
- ✅ **CORS Configuration**: Restrict origins to trusted domains
- ✅ **Reverse Proxy**: Use nginx/Apache for SSL termination
- ✅ **Rate Limiting**: Implement request rate limiting
- ✅ **Firewall**: Restrict network access to necessary ports
- ✅ **Monitoring**: Set up logging and alerting

### Reverse Proxy Setup (nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name mcp.your-company.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
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

## 📚 API Documentation

### HTTP Endpoints

| Endpoint        | Method | Description                    |
| --------------- | ------ | ------------------------------ |
| `/mcp`          | POST   | MCP JSON-RPC requests          |
| `/mcp`          | GET    | Server-Sent Events stream      |
| `/mcp`          | DELETE | Session termination            |
| `/health`       | GET    | Health check                   |

### MCP Protocol Flow

1. **Initialize**: Client sends `initialize` request
2. **Session**: Server responds with session ID
3. **Tools**: Client can call `tools/list` and `tools/call`
4. **Streaming**: Optional SSE connection for real-time updates
5. **Terminate**: Client sends DELETE request to end session

For detailed API documentation, see [HTTP Transport Guide](docs/http-transport.md).

## 📖 Documentation

- [HTTP Transport Usage Guide](./docs/http-transport.md) - Complete HTTP transport documentation  
- [Authentication Configuration Guide](./docs/en/authentication.md) - Detailed authentication methods and examples
- [MCP Protocol Specification](https://modelcontextprotocol.io/) - Official MCP documentation

## ⚠️ Limitations

### Record Operation Limitations

- **Attachment fields**: Attachment fields cannot be specified in the record add/update tool
- **Selection fields**: For user selection fields, organization selection fields, and group selection fields, add/update is only possible if choices are set

### Other Limitations

- **Guest space not supported**: Cannot access apps within guest spaces
- **Preview not supported**: The app preview environment (a test environment where you can verify app settings before activating them in production) is not available

- **File uploads**: Attachment fields are not supported in record operations
- **Rate limits**: Subject to Kintone API rate limits

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow the existing code style
4. **Add tests**: Ensure your changes are well tested
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**: Describe your changes clearly

### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/kintone-mcp-http.git
cd kintone-mcp-http

# Install dependencies
pnpm install

# Run tests
pnpm test

# Start development server
pnpm dev:http
```

## 🆘 Troubleshooting

### Common Issues

#### Connection Refused

```bash
# Check if server is running
curl http://127.0.0.1:3000/health

# Check logs
pnpm dev:http
```

#### CORS Errors

```bash
# Update CORS origin
CORS_ORIGIN="*" pnpm dev:http

# Or set specific origin
CORS_ORIGIN="https://your-app.com" pnpm dev:http
```

#### Authentication Errors

```bash
# Verify credentials
echo $KINTONE_BASE_URL
echo $KINTONE_USERNAME

# Test with curl
curl -X POST http://127.0.0.1:3000/mcp \
  -H "Accept: application/json, text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{}}}'
```

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/Jassada01/kintone-mcp-http/issues)
- **Discussions**: [Community support and questions](https://github.com/Jassada01/kintone-mcp-http/discussions)
- **Documentation**: [HTTP Transport Guide](docs/http-transport.md)

## 🏆 Acknowledgments

- Built on top of the [official Kintone MCP Server](https://github.com/kintone/mcp-server)
- Powered by [Model Context Protocol](https://modelcontextprotocol.io/)
- HTTP transport implementation using [Express.js](https://expressjs.com/)

## 📄 License

Copyright 2025 Enhanced by Community Contributors

Based on the original work by Cybozu, Inc.

Licensed under the [Apache 2.0](LICENSE) License.

---

**⭐ If this project helped you, please give it a star on GitHub!**

**🔗 Repository**: https://github.com/Jassada01/kintone-mcp-http
