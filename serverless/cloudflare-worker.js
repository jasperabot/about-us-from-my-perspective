function json(data, status = 200, origin = "*") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type"
    }
  });
}

function normalizeText(value, maxLen) {
  return String(value || "").trim().replace(/\r\n?/g, "\n").slice(0, maxLen);
}

function normalizeItemStates(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, 120).map((item) => ({
    key: normalizeText(item.key, 120),
    category: normalizeText(item.category, 30),
    statement: normalizeText(item.statement, 800),
    value: Boolean(item.value)
  }));
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "anonymous";
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export default {
  async fetch(request, env) {
    const requestOrigin = request.headers.get("origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "*";

    if (request.method === "OPTIONS") {
      return json({ ok: true }, 200, allowedOrigin);
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, allowedOrigin);
    }

    if (allowedOrigin !== "*" && requestOrigin !== allowedOrigin) {
      return json({ error: "Origin not allowed" }, 403, allowedOrigin);
    }

    if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO) {
      return json({ error: "Missing required server configuration" }, 500, allowedOrigin);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400, allowedOrigin);
    }

    const feedback = normalizeText(payload.feedback, 500);
    const itemStates = normalizeItemStates(payload.itemStates);

    if (!feedback) {
      return json({ error: "Feedback is required" }, 400, allowedOrigin);
    }

    if (itemStates.length === 0) {
      return json({ error: "Item states are required" }, 400, allowedOrigin);
    }

    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const stamp = now.toISOString().replace(/[:.]/g, "-");
    const trueCount = itemStates.filter((item) => item.value).length;
    const filePath = `submissions/${day}/${stamp}-state-reflection.md`;
    const statesList = itemStates
      .map((item) => `- [${item.value ? "true" : "false"}] (${item.category}) ${item.statement}`)
      .join("\n");

    const content = [
      "# New State Reflection",
      "",
      `- Submitted: ${now.toISOString()}`,
      `- Source: ${requestOrigin || "unknown"}`,
      `- True count: ${trueCount}`,
      `- False count: ${itemStates.length - trueCount}`,
      "",
      "## Brief Feedback",
      "",
      feedback,
      "",
      "## Item States",
      "",
      statesList,
      ""
    ].join("\n");

    const body = {
      message: "Add state reflection submission",
      content: bytesToBase64(new TextEncoder().encode(content)),
      branch: env.GITHUB_BRANCH || "main"
    };

    const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
    const githubUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${encodedPath}`;

    const githubRes = await fetch(githubUrl, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${env.GITHUB_TOKEN}`,
        accept: "application/vnd.github+json",
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!githubRes.ok) {
      const githubError = await githubRes.text();
      return json({ error: "GitHub commit failed", details: githubError }, 502, allowedOrigin);
    }

    const githubData = await githubRes.json();
    return json({ ok: true, path: filePath, commit: githubData.commit?.sha || null }, 200, allowedOrigin);
  }
};
