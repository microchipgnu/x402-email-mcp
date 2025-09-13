// ENV (Bun auto-loads .env)
export const RESEND_API_KEY = process.env.RESEND_API_KEY;
export const RESEND_FROM = process.env.RESEND_FROM || "no-reply@example.com";
export const FACILITATOR_URL = process.env.FACILITATOR_URL || "https://facilitator.payai.network";
export const TOOL_PRICE_SEND_EMAIL = process.env.TOOL_PRICE_SEND_EMAIL || "$0.005";

// Payout addresses from env with sensible defaults
export const EVM_ADDRESS = process.env.EVM_ADDRESS || "0xc9343113c791cB5108112CFADa453Eef89a2E2A2";
export const SVM_ADDRESS = process.env.SVM_ADDRESS || "4VQeAqyPxR9pELndskj38AprNj1btSgtaCrUci8N4Mdg";

// Comma-separated list is supported: "alice@example.com,bob@example.com"
export const RECIPIENT_EMAILS = (process.env.RECIPIENT_EMAIL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

// Optional Information section content
export const INFO_TITLE = (process.env.TITLE || "").trim();
export const IMAGE_URL = (process.env.IMAGE_URL || "").trim();
export const INFO_DESCRIPTION = (process.env.DESCRIPTION || "").trim();
export const INFO_URLS: string[] = (process.env.URLS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

if (RECIPIENT_EMAILS.length === 0) {
    console.warn(
        "[x402-mcp] Warning: RECIPIENT_EMAIL is not set. The send_email tool will throw until configured."
    );
}