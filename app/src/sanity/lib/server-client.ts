import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'

/**
 * Server-side Sanity client with write permissions (uses SANITY_API_TOKEN).
 * Use this for mutations (create, update, delete) from API routes.
 * 
 * IMPORTANT: This uses YOUR developer API token, not the professor's credentials.
 * The course document will be created "by" the server, but we store the professor's
 * user_id/walletAddress in the `createdBy` field for attribution.
 */
export const serverClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false, // Always false for mutations
})
