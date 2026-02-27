import { createImageUrlBuilder } from '@sanity/image-url'

import { dataset, projectId } from '../env'

type SanityImageSource = any

// https://www.sanity.io/docs/image-url
const builder = createImageUrlBuilder({ projectId, dataset })

export const urlFor = (source: SanityImageSource) => {
  return builder.image(source)
}
