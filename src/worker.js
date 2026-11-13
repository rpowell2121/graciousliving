// Gracious Living site Worker.
// Static pages are served straight from public/ (see wrangler.jsonc); this
// code only runs for /api/* routes.
//
// POST /api/contact  saves a contact form message to D1 (binding DB).
// POST /api/apply    saves a job application (and an optional resume up to
//                    1.5 MB) to D1. No health information is collected here.
// Until the D1 database is bound, it answers 503 and the page tells the
// visitor to call or email instead, so no message is ever silently lost.

const MAX = { name: 120, email: 200, phone: 40, interest: 2000, message: 4000 };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") return json({ error: "Use POST" }, 405);
      return contact(request, env);
    }
    if (url.pathname === "/api/apply") {
      if (request.method !== "POST") return json({ error: "Use POST" }, 405);
      return apply(request, env);
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
  const interest = clean("interest");
  const notes = clean("message");
  const msg = { name: clean("name"), email: clean("email"), phone: clean("phone"),
    message: interest ? `Interested in: ${interest}${notes ? "\n\n" + notes : ""}` : notes };
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

const APPLY_FIELDS = ["name", "address_phone", "email", "age_18", "work_authorized", "transportation",
  "drivers_license", "employment_type", "days_available", "shifts", "convictions", "discipline"];
const RESUME_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const RESUME_MAX = 1.5 * 1024 * 1024;

async function apply(request, env) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Could not read the form" }, 400);
  }
  if (form.get("website")) return json({ ok: true });

  const app = {};
  for (const k of APPLY_FIELDS) app[k] = String(form.get(k) || "").trim().slice(0, 2000);
  if (!app.name) return json({ error: "Please enter your full legal name" }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(app.email)) return json({ error: "Please enter a valid email" }, 400);

  let resume = null;
  const file = form.get("resume");
  if (file && typeof file === "object" && file.size > 0) {
    if (file.size > RESUME_MAX) return json({ error: "Resume is too large. Please keep it under 1.5 MB or email it to info@graciouslivingllc.com." }, 400);
    if (!RESUME_TYPES.includes(file.type) && !/\.(pdf|docx)$/i.test(file.name || "")) return json({ error: "Please attach a PDF or DOCX file" }, 400);
    resume = { name: String(file.name || "resume").slice(0, 200), type: file.type, data: new Uint8Array(await file.arrayBuffer()) };
  }

  if (!env.DB) return json({ error: "Form not connected yet" }, 503);

  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS job_applications (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       created_at TEXT NOT NULL DEFAULT (datetime('now')),
       ${APPLY_FIELDS.map((k) => k + " TEXT").join(", ")},
       resume_name TEXT, resume_type TEXT, resume BLOB)`
  ).run();
  await env.DB.prepare(
    `INSERT INTO job_applications (${APPLY_FIELDS.join(", ")}, resume_name, resume_type, resume)
     VALUES (${APPLY_FIELDS.map(() => "?").join(", ")}, ?, ?, ?)`
  ).bind(...APPLY_FIELDS.map((k) => app[k]), resume?.name ?? null, resume?.type ?? null, resume?.data ?? null).run();

  return json({ ok: true });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
