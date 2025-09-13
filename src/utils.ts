export function buildVercelDeployUrl({
    repositoryUrl = "https://github.com/microchipgnu/x402-email-mcp",
    projectName = "x402-email-mcp",
    repositoryName = "x402-email-mcp",
    env = [
        "RECIPIENT_EMAIL",
        "RESEND_FROM",
        "EVM_ADDRESS",
        "SVM_ADDRESS",
        "TITLE",
        "DESCRIPTION",
        "IMAGE_URL",
        "URLS"
    ],
    integrationIds = ["oac_KfIFnjXqCl4YJCHnt1bDTBI1"]
} = {}): string {
    const baseUrl = "https://vercel.com/new/clone";
    const params = new URLSearchParams({
        "repository-url": repositoryUrl,
        "project-name": projectName,
        "repository-name": repositoryName,
        "env": env.join(","),
        "integration-ids": integrationIds.join(",")
    });
    return `${baseUrl}?${params.toString()}`;
}


export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function sanitizeUrl(url: string): string {
    try {
        const u = new URL(url);
        return u.protocol === "http:" || u.protocol === "https:" ? url : "#";
    } catch {
        return "#";
    }
}

export function formatUrlLabel(url: string): string {
    try {
        const u = new URL(url);
        let label = `${u.hostname}${u.pathname}`.replace(/\/$/, "");
        if (label.length > 40) label = label.slice(0, 37) + "…";
        return label;
    } catch {
        return url.length > 40 ? url.slice(0, 37) + "…" : url;
    }
}

export function renderLinkButtons(INFO_URLS: string[]): string {
    if (!INFO_URLS.length) return "";
    return `<div class="mt-6 space-y-3">${INFO_URLS
        .map((u) => {
            const href = sanitizeUrl(u);
            const label = escapeHtml(formatUrlLabel(u));
            return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="block w-full rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/20 transition-colors px-4 py-3 text-white">${label}</a>`;
        })
        .join("")}</div>`;
}

export function renderProfileSection(INFO_TITLE: string, IMAGE_URL: string, INFO_DESCRIPTION: string, INFO_URLS: string[] ): string {
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

export function renderAboutSection(INFO_TITLE: string, TOOL_PRICE_SEND_EMAIL: string): string {
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

export function renderHeaderSection(): string {
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