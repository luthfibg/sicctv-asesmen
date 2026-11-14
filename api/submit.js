export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const d = req.body || {};
  if (d["bot-field"]) return res.status(200).json({ ok: true }); // spam
  if (!d.perusahaan || !d.pic || !d.whatsapp || !d.email || d.persetujuan !== "ya")
    return res.status(400).json({ ok: false });

  const baris = Object.entries(d)
    .filter(([k]) => k !== "form-name" && k !== "bot-field")
    .map(([k, v]) => `${k}: ${[].concat(v).join(", ")}`).join("\n");

  const tugas = [fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,            // mis. asesmen@domain-anda.com
      to: [process.env.MAIL_TO],              // email tim sales
      subject: `Asesmen baru: ${d.perusahaan}`,
      text: baris,
    }),
  })];
  if (process.env.SHEETS_WEBHOOK)
    tugas.push(fetch(process.env.SHEETS_WEBHOOK, { method: "POST", body: JSON.stringify(d) }));

  const hasil = await Promise.all(tugas);
  return res.status(hasil[0].ok ? 200 : 502).json({ ok: hasil[0].ok });
}