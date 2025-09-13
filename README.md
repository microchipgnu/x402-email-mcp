# x402-mcp

Minimal paid MCP server using Hono + x402 payments, with an example MCP client. It demonstrates how to expose tools over the Model Context Protocol (MCP) and gate specific tools behind on-chain payment using `mcpay`.

![](/image.png)

### Features
- **MCP server with Hono**: export a `fetch` handler Bun can serve by default.
- **Payment-gated tools**: enforce pricing via `mcpay` with EVM and Solana addresses.
- **Example MCP client**: uses the **Vercel AI SDK** to call MCP tools and automatically handle payment prompts.

## Quickstart

### 1) Install
```bash
bun install
```

### 2) Configure environment

Create a `.env` file (Bun auto-loads it) with values like:

```bash
# Email sending
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=no-reply@example.com
RECIPIENT_EMAIL=alice@example.com,bob@example.com

# Payments
FACILITATOR_URL=https://facilitator.x402.rs
TOOL_PRICE_SEND_EMAIL=$0.005

# Payout addresses
EVM_ADDRESS=0xc9343113c791cB5108112CFADa453Eef89a2E2A2
SVM_ADDRESS=0xc9343113c791cB5108112CFADa453Eef89a2E2A2

# Example client
MCP_SERVER_URL=http://localhost:3000/mcp
EVM_PRIVATE_KEY=0x...
SVM_PRIVATE_KEY=0x...
EVM_NETWORK=base
SVM_NETWORK=solana-devnet
```

### 3) Run the MCP server (Bun)
```bash
bun run index.ts
```
By default Bun serves on port 3000. The MCP endpoint is `http://localhost:3000/mcp`.

### 4) Run the example client (in a second terminal)
Set required environment variables, then run the client with Bun:

```bash
# ensure .env is populated, then run
bun run example/client.ts
```

Notes:
- Keys must be funded for the chosen networks.
- The client points at `MCP_SERVER_URL` and will invoke the tools via MCP.

## What’s included

- `index.ts` — Hono app exporting an MCP server. Payment gating is enabled via `withPayment` from `mcpay`.
- `example/client.ts` — Payment-aware MCP client built with the **Vercel AI SDK**, using `makePaymentAwareClientTransport`.
- `tsconfig.json` — Strict TypeScript config tuned for Bun.

## Tools exposed by the server

- **weather** (paid)
  - **Price**: `$0.001` per call (configured via `toolPricing`)
  - **Input**: `{ city: string }`
  - **Description**: Returns a canned weather string for the given city.

- **free_tool** (free)
  - **Input**: `{ s: string, city: string }`
  - **Description**: Simple example free tool.

## Configuration

Server configuration lives in `index.ts`:
- **Pricing**: update `toolPricing` to set per-tool prices.
- **Payout addresses**: set `payTo` for each supported network (e.g., `base-sepolia`, `solana-devnet`).
- **Facilitator**: configure the payment facilitator URL.

Client configuration lives in `example/client.ts`:
- **MCP server URL**: change `MCP_SERVER_URL` if you serve on a different host/port.
- **Networks/signers**: `createSigner` is used to construct EVM/Solana signers from environment variables.

## Commands

```bash
# Install deps
bun install

# Start server (http://localhost:3000/mcp)
bun run index.ts

# Run example client (requires env vars)
bun run example/client.ts
```

## References
- **x402**: [x402.rs](https://x402.org)
- **mcpay (npm)**: [npmjs.com/package/mcpay](https://www.npmjs.com/package/mcpay)
- **MCPay**: [MCPay.tech](https://mcpay.tech) 
- **Bun**: [bun.com](https://bun.com)
- **Hono**: [hono.dev](https://hono.dev)
- **Model Context Protocol (MCP)**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Vercel AI SDK**: [sdk.vercel.ai](https://sdk.vercel.ai)

This project was created using `bun init` (Bun v1.2.x).
