## 📬 SPAMCP

**Turn spam into 💸.**

SPAMCP is a minimal **paid MCP server** that charges people crypto to send you emails.
It’s built with [Hono](https://hono.dev) + [MCP](https://modelcontextprotocol.io), uses [mcpay](https://mcpay.tech) for payments, and includes a working **MCP client** using the [Vercel AI SDK](https://sdk.vercel.ai).

> 💡 Every call to your `send_email` tool requires a payment on-chain.
> If they want your attention, they’ve got to pay for it.

![](/imagelogo.png)

---

## ✨ Features

* ⚡ **MCP server with Hono** — Runs on [Bun](https://bun.com), exposing MCP tools over HTTP.
* 💸 **Payment-gated tools** — Require on-chain payment (EVM or Solana) using [mcpay](https://mcpay.tech).
* 📬 **Email sending** — Delivers emails via the [Resend](https://resend.com) API.
* 🤖 **Example MCP client** — Uses the [Vercel AI SDK](https://sdk.vercel.ai) to call your tools and auto-handle payments.
* 🧩 **Easy deployment** — Bun-first, Vercel-ready, environment-driven config.

![](/screenshot.png)

---

## ⚡ Quickstart

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment

Create a `.env` file (Bun auto-loads it) based on `.env.example`:

```bash
# Email sending
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=no-reply@example.com
RECIPIENT_EMAIL=alice@example.com,bob@example.com

# Payments
FACILITATOR_URL=https://facilitator.x402.rs
TOOL_PRICE_SEND_EMAIL=$0.005

# Payout addresses
EVM_ADDRESS=0xYourEvmAddress
SVM_ADDRESS=YourSolanaAddress

# Example client
MCP_SERVER_URL=http://localhost:3000/mcp
EVM_PRIVATE_KEY=0x...
SVM_PRIVATE_KEY=0x...
EVM_NETWORK=base
SVM_NETWORK=solana-devnet
```

### 3. Start the MCP server

```bash
bun run index.ts
```

By default this serves at `http://localhost:3000/mcp`

### 4. Run the example client

In a second terminal, run:

```bash
bun run example/client.ts
```

The client will:

* Fetch your MCP tools
* Pay to use `send_email`
* Deliver an email via Resend

---

## 🧠 How it works

* The MCP server exposes a single paid tool: `send_email`
* Each invocation requires an on-chain payment
* Payments are handled by `mcpay` and settled to your configured wallet addresses
* Emails are sent via the Resend API

This makes your inbox **pay-to-access**.

---

## ⚙️ Configuration

**Server (`index.ts`)**

* `toolPricing`: Set per-tool prices
* `payTo`: Configure your payout addresses for supported networks
* `facilitator.url`: Payment facilitator endpoint

**Client (`example/client.ts`)**

* `MCP_SERVER_URL`: Points to your MCP server
* `createSigner`: Creates EVM + Solana signers from private keys

---

## 🧪 Commands

```bash
# Install deps
bun install

# Start the MCP server
bun run index.ts

# Run the example MCP client
bun run example/client.ts
```

---

## 🧩 Tech Stack

* [Bun](https://bun.com) — Fast runtime
* [Hono](https://hono.dev) — Web framework
* [mcpay](https://mcpay.tech) — Payment-gated MCP tools
* [x402](https://x402.org) — On-chain payments
* [Resend](https://resend.com) — Email delivery
* [Vercel AI SDK](https://sdk.vercel.ai) — MCP client interface
* [Model Context Protocol](https://modelcontextprotocol.io) — Tool-calling protocol

---

## 💻 Deploy to Vercel

Click below to deploy your own SPAMCP instance:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/microchipgnu/x402-email-mcp&project-name=x402-email-mcp&repository-name=x402-email-mcp&env=RECIPIENT_EMAIL,RESEND_FROM,RESEND_API_KEY,EVM_ADDRESS,SVM_ADDRESS,TITLE,DESCRIPTION,IMAGE_URL,URLS)

---

## 📜 License

MIT — build cool stuff and make people pay to email you.