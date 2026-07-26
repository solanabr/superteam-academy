import { trackEvent } from "@/lib/analytics";

/**
 * Credential share helpers (LX-E3).
 *
 * Two distinct actions, per owner decision on #552:
 * - LinkedIn is a PROFILE-ENTRY action only (Add-to-Profile deep link).
 *   There is deliberately no LinkedIn share-post URL anywhere.
 * - The social-share channel is X (existing intent URL, now localized).
 */

/**
 * Issuer shown on the LinkedIn profile entry. Mirrors the `Platform`
 * attribute stamped into the credential NFT metadata
 * (app/api/certificates/mint/route.ts).
 */
export const CREDENTIAL_ISSUER_NAME = "Superteam Academy";

export type CredentialShareChannel = "x" | "linkedin_add";
export type CredentialShareSource = "certificate_page" | "mint_success";

export interface LinkedInAddToProfileParams {
  /** Certification name — the course title. */
  name: string;
  /**
   * Free-text issuer name. LinkedIn's format accepts organizationId XOR
   * organizationName; we use organizationName because the platform has no
   * claimed LinkedIn Page id.
   */
  organizationName: string;
  /** Issue year from minted_at. */
  issueYear: number;
  /** Issue month from minted_at, 1–12. */
  issueMonth: number;
  /** Public verification URL — the /certificates/[id] page. */
  certUrl: string;
  /** Credential id — the on-chain mint address (omitted while minting). */
  certId?: string;
}

/**
 * Builds the LinkedIn Add-to-Profile deep link for a certification.
 *
 * Format documented by LinkedIn's Add to Profile program
 * (addtoprofile.linkedin.com / help article a528030):
 *   /profile/add?startTask=CERTIFICATION_NAME&name=…&organizationName=…
 *     &issueYear=…&issueMonth=…&certUrl=…&certId=…
 * Expiration params are omitted — credentials do not expire.
 */
export function buildLinkedInAddToProfileUrl(
  params: LinkedInAddToProfileParams
): string {
  const url = new URL("https://www.linkedin.com/profile/add");
  url.searchParams.set("startTask", "CERTIFICATION_NAME");
  url.searchParams.set("name", params.name);
  url.searchParams.set("organizationName", params.organizationName);
  url.searchParams.set("issueYear", String(params.issueYear));
  url.searchParams.set("issueMonth", String(params.issueMonth));
  url.searchParams.set("certUrl", params.certUrl);
  if (params.certId) {
    url.searchParams.set("certId", params.certId);
  }
  return url.toString();
}

/** Builds the X (Twitter) web-intent URL for sharing a certificate page. */
export function buildXShareIntentUrl(text: string, shareUrl: string): string {
  const url = new URL("https://x.com/intent/tweet");
  url.searchParams.set("text", text);
  url.searchParams.set("url", shareUrl);
  return url.toString();
}

/**
 * Fires the `credential_share_click` analytics event. Follows the
 * `earn_handoff_click` (E8) convention: channel + surface + course id
 * when known.
 */
export function trackCredentialShareClick(
  channel: CredentialShareChannel,
  source: CredentialShareSource,
  courseId?: string
): void {
  trackEvent("credential_share_click", {
    channel,
    source,
    ...(courseId ? { courseId } : {}),
  });
}
