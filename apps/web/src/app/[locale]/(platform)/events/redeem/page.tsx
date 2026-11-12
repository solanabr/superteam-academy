import { RedeemEventForm } from "./redeem-event-form";

/**
 * `/events/redeem` — where a learner types the code shown at an event or
 * workshop. `?code=` prefills it, so a QR code or link on a slide works too.
 */
export default async function RedeemEventPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  const { code } = await searchParams;
  const initialCode = typeof code === "string" ? code.slice(0, 32) : "";

  return (
    <div className="mx-auto max-w-xl py-8">
      <RedeemEventForm initialCode={initialCode} />
    </div>
  );
}
