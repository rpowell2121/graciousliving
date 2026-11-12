// Gracious Living site Worker.
// Static pages are served straight from public/ (see wrangler.jsonc); this
// code only runs for /api/* routes.
//
// POST /api/contact  saves a contact form message to D1 (binding DB).
// Until the D1 database is bound, it answers 503 and the page tells the
// visitor to call or email instead, so no message is ever silently lost.

const MAX = { name: 120, email: 200, phone: 40, message: 4000 };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") return json({ error: "Use POST" }, 405);
      return contact(request, env);
    }
    return json({ error: "Not found" }, 404);
  },
};

async function contact(request, env) {
  let data;
  try {
    const type = request.headers.get("content-type") || "";
    data = type.includes("application/json")
      ? await request.json()
      : Object.fromEntries(await request.formData());
  } catch {
    return json({ error: "Could not read the form" }, 400);
  }

  // Honeypot: real visitors never fill the hidden "website" field.
  if (data.website) return json({ ok: true });

  const clean = (k) => String(data[k] || "").trim().slice(0, MAX[k]);
  const msg = { name: clean("name"), email: clean("email"), phone: clean("phone"), message: clean("message") };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg.email)) return json({ error: "Please enter a valid email" }, 400);

  if (!env.DB) return json({ error: "Form not connected yet" }, 503);

  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS contact_messages (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       created_at TEXT NOT NULL DEFAULT (datetime('now')),
       name TEXT, email TEXT NOT NULL, phone TEXT, message TEXT,
       page TEXT, referrer TEXT, country TEXT)`
  ).run();
  await env.DB.prepare(
    `INSERT INTO contact_messages (name, email, phone, message, page, referrer, country)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    msg.name, msg.email, msg.phone, msg.message,
    String(data.page || "").slice(0, 200),
    (request.headers.get("referer") || "").slice(0, 300),
    request.cf?.country || null
  ).run();

  return json({ ok: true });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
