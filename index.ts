import { Hono } from "hono";
import { createMcpHandler } from "mcp-handler";
import { withPayment } from "mcpay/handler";
import { z } from "zod";

type ResendSendResponse = { id?: string };
type ResendErrorPayload = { message?: string; error?: string };

// ENV (Bun auto-loads .env)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "no-reply@example.com";
const FACILITATOR_URL = process.env.FACILITATOR_URL || "https://facilitator.payai.network";
const TOOL_PRICE_SEND_EMAIL = process.env.TOOL_PRICE_SEND_EMAIL || "$0.005";

// Payout addresses from env with sensible defaults
const EVM_ADDRESS = process.env.EVM_ADDRESS || "0xc9343113c791cB5108112CFADa453Eef89a2E2A2";
const SVM_ADDRESS = process.env.SVM_ADDRESS || "4VQeAqyPxR9pELndskj38AprNj1btSgtaCrUci8N4Mdg";

// Comma-separated list is supported: "alice@example.com,bob@example.com"
const RECIPIENT_EMAILS = (process.env.RECIPIENT_EMAIL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

if (RECIPIENT_EMAILS.length === 0) {
    console.warn(
        "[x402-mcp] Warning: RECIPIENT_EMAIL is not set. The send_email tool will throw until configured."
    );
}

async function sendEmailViaResend({
    to,
    subject,
    body,
    idempotencyKey,
}: {
    to: string[]; // allow multiple
    subject: string;
    body: string;
    idempotencyKey?: string;
}): Promise<ResendSendResponse> {
    if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
            ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        },
        body: JSON.stringify({
            from: RESEND_FROM,
            to, // array supported by Resend
            subject,
            text: body,
        }),
    });

    const json = (await res.json().catch(() => ({}))) as unknown;
    if (!res.ok) {
        const err = (json || {}) as ResendErrorPayload;
        const msg = err.message || err.error || `Email provider error (${res.status})`;
        throw new Error(msg);
    }
    return (json as ResendSendResponse); // { id, ... }
}

const app = new Hono();

const base = createMcpHandler(
    (server) => {
        // ---- Paid tool that *always* sends to RECIPIENT_EMAIL(S) ----
        server.tool(
            "send_email",
            "Send an email to the preconfigured recipient(s) (paid).",
            {
                subject: z.string().min(1).max(200),
                body: z.string().min(1),
            },
            async ({ subject, body }) => {
                if (RECIPIENT_EMAILS.length === 0) {
                    throw new Error(
                        "Server not configured: set RECIPIENT_EMAIL in env (comma-separated for multiple)."
                    );
                }
                const idempotencyKey = crypto.randomUUID();
                const result = await sendEmailViaResend({
                    to: RECIPIENT_EMAILS,
                    subject,
                    body,
                    idempotencyKey,
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: `Email queued to ${RECIPIENT_EMAILS.join(
                                ", "
                            )} with subject "${subject}". Provider id: ${result.id ?? "unknown"}.`,
                        },
                    ],
                };
            }
        );
    },
    {
        serverInfo: { name: "paid-mcp", version: "1.2.0" },
    }
);

const paid = withPayment(base, {
    toolPricing: {
        send_email: TOOL_PRICE_SEND_EMAIL,
    },
    payTo: {
        base: EVM_ADDRESS,
        avalanche: EVM_ADDRESS,
        sei: EVM_ADDRESS,
        iotex: EVM_ADDRESS,
        solana: SVM_ADDRESS,
    },
    facilitator: { url: FACILITATOR_URL as `${string}://${string}` },
});

app.get("/", (c) => {
    return c.html("<h1>MCP Server that monetizes on email sending</h1>");
});

// Serve MCP under /mcp/* to match client default
app.use("/mcp/*", (c) => paid(c.req.raw));
export default app;
