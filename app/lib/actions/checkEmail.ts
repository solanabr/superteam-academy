/**
 * @fileoverview Server actions for initial user verification.
 * Contains lightweight checks like email availability.
 */
"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

/**
 * Checks if an email address is already registered in the database.
 * Used for client-side validation during the signup flow.
 */
export async function checkEmailExists(email: string): Promise<boolean> {
	const found = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, email.toLowerCase().trim()))
		.limit(1);

	return found.length > 0;
}
