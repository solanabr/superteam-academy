/**
 * @fileoverview BetterAuth API route handler.
 * Catches all authentication-related requests and forwards them to the BetterAuth handler.
 */

import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
