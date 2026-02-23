import type { Context } from "hono";
import { PublicKey } from "@solana/web3.js";
import { badRequest } from "./errors.js";

export type JsonObject = Record<string, unknown>;

function parseNumberValue(
  value: unknown,
  field: string,
  options?: { min?: number; integer?: boolean }
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw badRequest(`${field} must be a finite number`);
  }
  if (options?.integer && !Number.isInteger(value)) {
    throw badRequest(`${field} must be an integer`);
  }
  if (options?.min != null && value < options.min) {
    throw badRequest(`${field} must be >= ${options.min}`);
  }
  return value;
}

export async function readJsonObject(c: Context): Promise<JsonObject> {
  let body: unknown;
  try {
    body = await c.req.json<unknown>();
  } catch {
    throw badRequest("Invalid JSON body");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw badRequest("Request body must be a JSON object");
  }
  return body as JsonObject;
}

export function readRequiredString(body: JsonObject, field: string): string {
  const value = body[field];
  if (typeof value !== "string") {
    throw badRequest(`${field} is required`);
  }
  return value;
}

export function readOptionalString(
  body: JsonObject,
  field: string,
  defaultValue?: string
): string | undefined {
  const value = body[field];
  if (value === undefined) {
    return defaultValue;
  }
  if (typeof value !== "string") {
    throw badRequest(`${field} must be a string`);
  }
  return value;
}

export function readRequiredNumber(
  body: JsonObject,
  field: string,
  options?: { min?: number; integer?: boolean }
): number {
  const value = body[field];
  if (value === undefined) {
    throw badRequest(`${field} is required`);
  }
  return parseNumberValue(value, field, options);
}

export function readOptionalNumber(
  body: JsonObject,
  field: string,
  options?: { defaultValue?: number; min?: number; integer?: boolean }
): number | undefined {
  const value = body[field];
  if (value === undefined) {
    return options?.defaultValue;
  }
  return parseNumberValue(value, field, options);
}

export function readNullableNumber(
  body: JsonObject,
  field: string,
  options?: { min?: number; integer?: boolean }
): number | null {
  const value = body[field];
  if (value === undefined || value === null) {
    return null;
  }
  return parseNumberValue(value, field, options);
}

export function readNullableBoolean(
  body: JsonObject,
  field: string
): boolean | null {
  const value = body[field];
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "boolean") {
    throw badRequest(`${field} must be a boolean`);
  }
  return value;
}

export function readFixedLengthNumberArrayOrNull(
  body: JsonObject,
  field: string,
  expectedLength: number
): number[] | null {
  const value = body[field];
  if (value === undefined || value === null) {
    return null;
  }
  if (!Array.isArray(value)) {
    throw badRequest(`${field} must be an array of numbers`);
  }

  const parsed = value.map((entry, index) =>
    parseNumberValue(entry, `${field}[${index}]`, {
      integer: true,
      min: 0,
    })
  );

  if (parsed.length !== expectedLength) {
    throw badRequest(`${field} must have length ${expectedLength}`);
  }

  return parsed;
}

export function parsePublicKey(value: unknown, field: string): PublicKey {
  if (typeof value !== "string") {
    throw badRequest(`${field} must be a base58 public key string`);
  }
  try {
    return new PublicKey(value);
  } catch {
    throw badRequest(`${field} is not a valid public key`);
  }
}

export function readRequiredPublicKey(
  body: JsonObject,
  field: string
): PublicKey {
  return parsePublicKey(body[field], field);
}

export function readOptionalPublicKey(
  body: JsonObject,
  field: string,
  defaultValue?: PublicKey
): PublicKey | undefined {
  const value = body[field];
  if (value === undefined) {
    return defaultValue;
  }
  return parsePublicKey(value, field);
}
