/**
 * Credential NFT metadata schema compatible with Metaplex/display.
 * Used when uploading to Pinata; attributes surface in wallets.
 */
export interface CredentialMetadataAttributes {
  track_id?: number;
  level?: number;
  courses_completed?: number;
  total_xp?: number;
  course_id?: string;
}

export interface CredentialMetadataPayload {
  name: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

function attributesToTraits(attrs: CredentialMetadataAttributes): Array<{ trait_type: string; value: string | number }> {
  const out: Array<{ trait_type: string; value: string | number }> = [];
  if (attrs.track_id != null) out.push({ trait_type: "track_id", value: attrs.track_id });
  if (attrs.level != null) out.push({ trait_type: "level", value: attrs.level });
  if (attrs.courses_completed != null) out.push({ trait_type: "courses_completed", value: attrs.courses_completed });
  if (attrs.total_xp != null) out.push({ trait_type: "total_xp", value: attrs.total_xp });
  if (attrs.course_id != null) out.push({ trait_type: "course_id", value: attrs.course_id });
  return out;
}

export function buildCredentialMetadata(
  name: string,
  options: {
    description?: string;
    image?: string;
    external_url?: string;
    attributes?: CredentialMetadataAttributes;
  } = {}
): CredentialMetadataPayload {
  const payload: CredentialMetadataPayload = {
    name,
    ...(options.description && { description: options.description }),
    ...(options.image && { image: options.image }),
    ...(options.external_url && { external_url: options.external_url }),
  };
  if (options.attributes && Object.keys(options.attributes).length > 0) {
    payload.attributes = attributesToTraits(options.attributes);
  }
  return payload;
}
