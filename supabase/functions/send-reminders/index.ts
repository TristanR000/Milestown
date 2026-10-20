// Milestown: stuurt één keer per dag de rustige herinneringen.
// Een taak die drie dagen wacht, levert hooguit één melding op: geen getallen, geen druk.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const DAY = 864e5;

type Resident = { id: string; name?: string; text?: string; status?: string; createdAt?: string; pinged?: boolean };

function message(due: Resident[]) {
  if (due.length === 1) {
    const r = due[0], first = (r.name || "Een inwoner").split(" ")[0];
    const t = (r.text || "").length > 50 ? (r.text || "").slice(0, 48) + "…" : r.text || "";
    return { title: `${first} zegt hoi`, body: t ? `Ik sta klaar om te verhuizen zodra je „${t}" hebt gedaan. Geen haast hoor!` : "Ik sta klaar om te verhuizen. Geen haast hoor!", tag: `milestown-${r.id}` };
  }
  return { title: "Milestown", body: "Een paar toekomstige inwoners zeggen hoi. Ze wachten rustig af, geen haast!", tag: "milestown-groet" };
}

Deno.serve(async req => {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret) return new Response("Niet toegestaan", { status: 401 });

  webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") || "https://tristanr000.github.io/Milestown/", Deno.env.get("VAPID_PUBLIC_KEY")!, Deno.env.get("VAPID_PRIVATE_KEY")!);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  const { data: cities, error } = await db.from("cities").select("user_id, data");
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  const now = Date.now();
  let sent = 0, users = 0;
  for (const city of cities ?? []) {
    const residents: Resident[] = Array.isArray(city.data?.residents) ? city.data.residents : [];
    // in de app al gezien (pinged) of nog geen drie dagen oud: overslaan
    const due = residents.filter(r => r.status === "future" && !r.pinged && now - (Date.parse(r.createdAt || "") || now) >= 3 * DAY);
    if (!due.length) continue;
    const { data: logged } = await db.from("push_log").select("task_id").eq("user_id", city.user_id).in("task_id", due.map(r => r.id));
    const done = new Set((logged ?? []).map(l => l.task_id));
    const fresh = due.filter(r => !done.has(r.id));
    if (!fresh.length) continue;
    const { data: subs } = await db.from("push_subscriptions").select("endpoint, subscription").eq("user_id", city.user_id);
    if (!subs || !subs.length) continue;

    const payload = JSON.stringify(message(fresh));
    let delivered = 0;
    for (const s of subs) {
      try { await webpush.sendNotification(s.subscription, payload, { TTL: 86400, urgency: "low" }); delivered++; }
      catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        // apparaat bestaat niet meer: opruimen
        if (code === 404 || code === 410) await db.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        else console.warn("Melding mislukt", code, (e as Error).message);
      }
    }
    if (delivered) {
      await db.from("push_log").upsert(fresh.map(r => ({ user_id: city.user_id, task_id: r.id })));
      sent += delivered; users++;
    }
  }
  return Response.json({ ok: true, users, sent, checked: cities?.length ?? 0 });
});
