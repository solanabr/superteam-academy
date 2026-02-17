export const apiVersion =
    process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-02-18'

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

export const useCdn = false

function assertValue(v: string | undefined): string {
    if (v === undefined) {
        throw new Error('Using Sanity requires valid environment variables.')
    }
    return v
}
