# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Official MCP (Model Context Protocol) Server for Kintone - A TypeScript-based server that provides AI models with access to Kintone applications, records, and settings through standardized MCP tools.

## Technology Stack

- **Runtime**: Node.js >= 22
- **Language**: TypeScript
- **Package Manager**: pnpm (version 10.15.0)
- **Main Dependencies**: 
  - `@modelcontextprotocol/sdk` - MCP server framework
  - `@kintone/rest-api-client` - Kintone API client
  - `zod` - Schema validation
- **Testing**: Vitest
- **Linting**: ESLint with Cybozu config

## Common Development Commands

```bash
# Development
pnpm dev              # Start stdio development server with watch mode
pnpm dev:http         # Start HTTP development server with watch mode
pnpm start            # Start stdio production server
pnpm start:http       # Start HTTP production server

# Building
pnpm build            # Compile TypeScript to dist/
pnpm build:dxt        # Build DXT package for Claude Desktop

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode  
pnpm test:coverage    # Run tests with coverage report

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:eslint      # Run ESLint specifically
pnpm lint:prettier    # Check Prettier formatting
pnpm fix              # Fix all auto-fixable issues
pnpm typecheck        # Run TypeScript type checking

# Maintenance
pnpm clean            # Clean all build artifacts
pnpm clean:dist       # Clean compiled output
```

## Architecture & Code Structure

### MCP Server Architecture
- **Entry Points**: 
  - `src/index.ts` - Stdio transport server (default)
  - `src/http-server.ts` - HTTP transport server with REST endpoints
- **Server Configuration**: `src/server.ts` - Defines MCP server with available tools
- **Client Management**: `src/client.ts` - Manages Kintone REST API client instances

### Configuration System
- **Schema**: `src/config/schema.ts` - Zod schemas for environment validation
- **Parsing**: `src/config/index.ts` - Command line and environment variable parsing
- **Priority**: Command line args > environment variables

### Tool System
- **Registry**: `src/tools/index.ts` - Central registry of all available MCP tools
- **Base Types**: `src/tools/utils.ts` - `createTool` helper and type definitions
- **Tool Categories**:
  - `src/tools/kintone/app/` - App metadata tools (get-app, get-apps, get-form-fields, etc.)
  - `src/tools/kintone/record/` - Record CRUD tools (add/get/update/delete records, update-statuses)

### Tool Development Pattern
Each tool follows consistent structure:
1. Input/output Zod schemas for validation
2. `createTool()` function with name, config, and callback
3. Callback uses `parseKintoneClientConfig()` and `getKintoneClient()`
4. Returns structured content and text representation

### Transport Support
- **Stdio Transport** (default): Standard input/output communication for AI clients
- **HTTP Transport**: REST API endpoints with optional SSE streaming
  - Endpoint: `http://localhost:3000/mcp`
  - Security: Origin validation, localhost binding
  - CORS support with configurable origins

### HTTP Server Configuration
Environment variables and command line options for HTTP mode:
- `PORT` / `--port`: Server port (default: 3000)  
- `HOST` / `--host`: Server host (default: localhost)
- `CORS_ORIGIN` / `--cors-origin`: CORS origin pattern

## プロジェクト固有の開発ルール

### 新しいツールの追加

1. `src/tools/`にファイル作成
2. `createTool`関数で定義
3. `src/tools/index.ts`のtools配列に追加

### Kintoneツール開発

```typescript
const config = parseKintoneClientConfig();
const client = getKintoneClient(config);
```

### テスト作成時の注意点

- `mockExtra`ユーティリティを使用
- KintoneRestAPIClientは直接モック：

```typescript
vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn().mockImplementation(() => ({
    app: { getApp: mockGetApp },
  })),
}));
```

## コミット・PR規約

- **コミットメッセージ**: Semantic Commit Messages形式
  - `feat:` 新機能
  - `fix:` バグ修正
  - `docs:` ドキュメント更新
  - `refactor:` リファクタリング
  - `test:` テスト追加/修正
  - `chore:` ビルドプロセス/ツール変更
- **PRタイトル**: 同様にSemantic形式で記述
