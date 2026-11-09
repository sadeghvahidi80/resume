// Cloudflare Worker — contact form relay (sadeghvahidi.ir → Telegram)
// Site: https://sadeghvahidi.ir (Task 6 form: buildTelegramPayload).
// Secrets (dashboard → Settings → Variables → Secrets):
//   TG_TOKEN   — BotFather token
//   TG_CHAT_ID — destination chat id
export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin") || "";
    const allowed = ["https://sadeghvahidi.ir"];
    const cors = origin && allowed.includes(origin)
      ? {
          "access-control-allow-origin": origin,
          "access-control-allow-headers": "content-type",
          "access-control-allow-methods": "POST",
          "access-control-max-age": "86400"
        }
      : {};
    // Preflight BEFORE the 405 short-circuit — browser sends CORS preflight first.
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: { allow: "POST" } });
    }
    let d;
    try {
      d = await request.json();
    } catch {
      return new Response("Bad JSON", { status: 400, headers: cors });
    }
    if (!d || !d.name || !d.contact || !d.message || !d.type) {
      return new Response("Missing fields", { status: 422, headers: cors });
    }
    const text = `📨 درخواست همکاری از سایت\n\nنام: ${d.name}\nارتباط: ${d.contact}\nنوع: ${d.type}\nزبان صفحه: ${d.lang || "-"}\nصفحه: ${d.page || "-"}\n\nپیام:\n${d.message}`;
    const tg = await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: env.TG_CHAT_ID, text })
    });
    return new Response(tg.ok ? "OK" : "Telegram failed", { status: tg.ok ? 200 : 502, headers: cors });
  }
}
