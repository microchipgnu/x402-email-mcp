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

// Optional Information section content
const INFO_TITLE = (process.env.TITLE || "").trim();
const IMAGE_URL = (process.env.IMAGE_URL || "").trim();
const INFO_DESCRIPTION = (process.env.DESCRIPTION || "").trim();
const INFO_URLS: string[] = (process.env.URLS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

if (RECIPIENT_EMAILS.length === 0) {
    console.warn(
        "[x402-mcp] Warning: RECIPIENT_EMAIL is not set. The send_email tool will throw until configured."
    );
}


const VERCEL_DEPLOY_URL = buildVercelDeployUrl();

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
        serverInfo: { name: `${INFO_TITLE} MCP Server`, version: "1.2.0" },
    }
);

const paid = withPayment(base, {
    toolPricing: {
        send_email: TOOL_PRICE_SEND_EMAIL,
    },
    payTo: {
        "base-sepolia": EVM_ADDRESS,
        "solana-devnet": SVM_ADDRESS,
    },
    facilitator: { url: FACILITATOR_URL as `${string}://${string}` },
});

app.get("/", (c) => {
    return c.html(`
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>${escapeHtml(INFO_TITLE || "MCP Email Monetization Server")}</title>
            <meta name="color-scheme" content="dark" />
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <style>html { font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif; }</style>
        </head>
        <body class="relative min-h-screen m-0 grid place-items-center bg-gradient-to-br from-[#2c5364] via-[#203a43] to-[#0f2027] text-white">
        ${renderHeaderSection()}
            <main class="mx-4">
                <section class="rounded-2xl bg-white/10 backdrop-blur-md shadow-2xl ring-1 ring-white/10 p-10 max-w-md text-center">
                    ${renderProfileSection(INFO_TITLE, IMAGE_URL, INFO_DESCRIPTION, INFO_URLS)}
                    ${renderAboutSection(INFO_TITLE, TOOL_PRICE_SEND_EMAIL)}
                </section>
            </main>
            <footer class="pointer-events-none absolute inset-x-0 bottom-0 p-4">
                <div class="pointer-events-auto mx-auto flex max-w-3xl items-center justify-center gap-6">
                    <a href="https://github.com/microchipgnu/x402-email-mcp" target="_blank" rel="noopener" class="flex items-center gap-2 text-emerald-300/90 hover:text-white transition-colors underline decoration-emerald-400/30 hover:decoration-white">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 inline-block align-text-bottom"><path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.417-.012 2.747 0 .268.18.58.688.482C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2z"/></svg>
                        GitHub
                    </a>
                    <a class="inline-block" href="${VERCEL_DEPLOY_URL}" target="_blank" rel="noopener">
                        <img class="h-8" src="https://vercel.com/button" alt="Deploy with Vercel"/>
                    </a>
                </div>
            </footer>
            <script>(function(){
                const base = window.location.origin + window.location.pathname;
                const endpoint = (base.endsWith('/') ? base.slice(0, -1) : base) + '/mcp';
                const urlEl = document.getElementById('url');
                if (urlEl) urlEl.textContent = endpoint;

                const copyBtn = document.getElementById('url-copy');
                if (copyBtn && endpoint) {
                    copyBtn.addEventListener('click', async () => {
                        try {
                            await navigator.clipboard.writeText(endpoint);
                            const prevTitle = copyBtn.getAttribute('title') || '';
                            copyBtn.setAttribute('title', 'Copied');
                            const originalText = copyBtn.textContent || 'copy';
                            copyBtn.textContent = 'copied';
                            setTimeout(() => {
                                copyBtn.setAttribute('title', prevTitle || 'Copy endpoint');
                                copyBtn.textContent = originalText;
                            }, 1200);
                        } catch (e) {}
                    });
                }
            })();</script>
        </body>
        </html>
    `);
});

// Serve MCP under /mcp/* to match client default
app.use("/mcp/*", (c) => paid(c.req.raw));
export default app;


function buildVercelDeployUrl({
    repositoryUrl = "https://github.com/microchipgnu/x402-email-mcp",
    projectName = "x402-email-mcp",
    repositoryName = "x402-email-mcp",
    env = [
        "RECIPIENT_EMAIL",
        "RESEND_FROM",
        "RESEND_API_KEY",
        "EVM_ADDRESS",
        "SVM_ADDRESS",
        "TITLE",
        "DESCRIPTION",
        "IMAGE_URL",
        "URLS"
    ],
    // integrationIds = ["oac_KfIFnjXqCl4YJCHnt1bDTBI1"]
} = {}): string {
    const baseUrl = "https://vercel.com/new/clone";
    const params = new URLSearchParams({
        "repository-url": repositoryUrl,
        "project-name": projectName,
        "repository-name": repositoryName,
        "env": env.join(","),
        // "integration-ids": integrationIds.join(",")
    });
    return `${baseUrl}?${params.toString()}`;
}


function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function sanitizeUrl(url: string): string {
    try {
        const u = new URL(url);
        return u.protocol === "http:" || u.protocol === "https:" ? url : "#";
    } catch {
        return "#";
    }
}

function formatUrlLabel(url: string): string {
    try {
        const u = new URL(url);
        let label = `${u.hostname}${u.pathname}`.replace(/\/$/, "");
        if (label.length > 40) label = label.slice(0, 37) + "…";
        return label;
    } catch {
        return url.length > 40 ? url.slice(0, 37) + "…" : url;
    }
}

function renderLinkButtons(INFO_URLS: string[]): string {
    if (!INFO_URLS.length) return "";
    return `<div class="mt-6 space-y-3">${INFO_URLS
        .map((u) => {
            const href = sanitizeUrl(u);
            const label = escapeHtml(formatUrlLabel(u));
            return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="block w-full rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/20 transition-colors px-4 py-3 text-white">${label}</a>`;
        })
        .join("")}</div>`;
}

function renderProfileSection(INFO_TITLE: string, IMAGE_URL: string, INFO_DESCRIPTION: string, INFO_URLS: string[] ): string {
    const heading = escapeHtml(INFO_TITLE || "Paid Email Sending");
    const imageUrl = IMAGE_URL || "https://pbs.twimg.com/profile_images/1961191512546390016/1SYYSX-x_400x400.jpg";
    const imageAlt = "Email Me";
    const imageHtml = `<img src="${imageUrl}" alt="${imageAlt}" class="w-12 h-12 mb-3 rounded-full shadow-lg border-2 border-white/20" loading="lazy" />`;

    const titleHtml = `<h1 class="text-3xl font-extrabold mb-2 text-white drop-shadow">${heading}</h1>`;

    const descHtml = INFO_DESCRIPTION
        ? `<p class="text-slate-300 text-base mb-2">${escapeHtml(INFO_DESCRIPTION)}</p>`
        : "";

    const linksHtml = renderLinkButtons(INFO_URLS);

    return `
        <section class="flex flex-col items-center text-center mb-6">
            ${imageHtml}
            ${titleHtml}
            ${descHtml}
            ${linksHtml}
        </section>
    `.trim();
}

function renderAboutSection(INFO_TITLE: string, TOOL_PRICE_SEND_EMAIL: string): string {
    const title = "About";
    const description = `This MCP server will send emails to ${escapeHtml(INFO_TITLE || "the configured recipients")}, with a payment required per email. The price is <strong>$${TOOL_PRICE_SEND_EMAIL}</strong>.`;
    return `
        <div class="mt-8 border-t border-white/10 pt-6 text-center">
            <h2 class="mb-2 text-xs font-semibold uppercase tracking-widest text-white/60">${escapeHtml(title)}</h2>
            <div class="flex justify-center">
                <p class="text-[0.8rem] leading-relaxed text-white/70 max-w-xs mx-auto">${description}</p>
            </div>
            <div class="mb-5 flex justify-center items-center gap-2 mt-6">
                <span class="rounded-md bg-white/10 px-4 py-1 text-xs font-mono text-white border border-white/20" id="url" title="Client endpoint"></span>
                <button id="url-copy" type="button" title="Copy endpoint" class="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300" aria-label="Copy endpoint">copy</button>
            </div>
        </div>
    `.trim();
}

function renderHeaderSection(): string {
    return `
        <header class="absolute left-1/2 top-0 transform -translate-x-1/2 mt-8 pt-6 text-center w-full max-w-lg">
            <div class="flex flex-col items-center gap-2">
                <h1 class="text-4xl font-extrabold text-white drop-shadow-lg tracking-tight">
                    <span class="text-emerald-300 underline">SPA</span><span class="text-emerald-400"><span class="underline">M</span>CP</span>
                </h1>
                <p class="text-slate-300 text-sm mt-1 font-medium">
                    Turn spam into revenue.
                </p>
            </div>
        </header>
    `.trim();
}