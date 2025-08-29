#!/usr/bin/env node
import "dotenv/config";
import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createServer } from "./server.js";
import { parseKintoneClientConfig } from "./config/index.js";
import { getKintoneClient } from "./client.js";

const main = async () => {
  const config = parseKintoneClientConfig();
  getKintoneClient(config);
  
  const port = parseInt(process.env.PORT || "3000", 10);
  const host = process.env.HOST || "localhost";
  const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:*";
  
  const app = express();
  app.use(express.json());
  
  // CORS configuration
  app.use(cors({
    origin: corsOrigin === "*" ? "*" : corsOrigin,
    exposedHeaders: ["Mcp-Session-Id"],
    credentials: true,
  }));
  
  // Security middleware
  app.use((req, res, next) => {
    // Validate Origin header to prevent DNS rebinding attacks
    const origin = req.headers.origin;
    if (origin && !origin.startsWith('http://localhost') && !origin.startsWith('https://localhost')) {
      console.warn(`Suspicious origin: ${origin}`);
    }
    
    // Log requests for debugging
    console.log(`${new Date().toISOString()} ${req.method} ${req.url} from ${origin || 'unknown'}`);
    next();
  });
  
  // Map to store transports by session ID
  const transports: Record<string, StreamableHTTPServerTransport> = {};
  
  // MCP POST endpoint
  const mcpPostHandler = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers['mcp-session-id'] as string;
    
    if (sessionId) {
      console.log(`Received MCP request for session: ${sessionId}`);
    } else {
      console.log('Request body:', req.body);
    }
    
    try {
      let transport: StreamableHTTPServerTransport;
      
      if (sessionId && transports[sessionId]) {
        // Reuse existing transport
        transport = transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sessionId: string) => {
            console.log(`Session initialized with ID: ${sessionId}`);
            transports[sessionId] = transport;
          },
          enableDnsRebindingProtection: false,
        });
        
        // Set up onclose handler
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports[sid]) {
            console.log(`Transport closed for session ${sid}, removing from transports map`);
            delete transports[sid];
          }
        };
        
        // Connect the transport to the MCP server
        const server = createServer();
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      } else {
        // Invalid request
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided',
          },
          id: null,
        });
        return;
      }
      
      // Handle the request with existing transport
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  };
  
  // MCP GET endpoint for SSE streams
  const mcpGetHandler = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers['mcp-session-id'] as string;
    
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    
    const lastEventId = req.headers['last-event-id'] as string;
    if (lastEventId) {
      console.log(`Client reconnecting with Last-Event-ID: ${lastEventId}`);
    } else {
      console.log(`Establishing new SSE stream for session ${sessionId}`);
    }
    
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  };
  
  // MCP DELETE endpoint for session termination
  const mcpDeleteHandler = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers['mcp-session-id'] as string;
    
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    
    console.log(`Received session termination request for session ${sessionId}`);
    
    try {
      const transport = transports[sessionId];
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error('Error handling session termination:', error);
      if (!res.headersSent) {
        res.status(500).send('Error processing session termination');
      }
    }
  };
  
  // Register routes
  app.post('/mcp', mcpPostHandler);
  app.get('/mcp', mcpGetHandler);
  app.delete('/mcp', mcpDeleteHandler);
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      sessions: Object.keys(transports).length 
    });
  });
  
  // Start server
  app.listen(port, host, () => {
    console.error(`HTTP MCP Server started:`);
    console.error(`  URL: http://${host}:${port}/mcp`);
    console.error(`  Health: http://${host}:${port}/health`);
    console.error(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.error(`  Kintone URL: ${config.config.KINTONE_BASE_URL}`);
    console.error(`  Auth method: ${config.isApiTokenAuth ? 'API Token' : 'Password'}`);
    console.error(`  CORS Origin: ${corsOrigin}`);
  });
  
  // Handle server shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    
    for (const sessionId in transports) {
      try {
        console.log(`Closing transport for session ${sessionId}`);
        await transports[sessionId].close();
        delete transports[sessionId];
      } catch (error) {
        console.error(`Error closing transport for session ${sessionId}:`, error);
      }
    }
    
    console.log('Server shutdown complete');
    process.exit(0);
  });
};

main().catch((error) => {
  console.error("Failed to start HTTP server:", error);
  process.exit(1);
});