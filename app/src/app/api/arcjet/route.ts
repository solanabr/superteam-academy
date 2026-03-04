
import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/next";

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: "LIVE" }),
    slidingWindow({ mode: "LIVE", interval: "1m", max: 100 })
  ],
});

export async function GET(req: Request) {
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    return new Response("Forbidden", { status: 403 });
  }

  return Response.json({ ok: true });
}
