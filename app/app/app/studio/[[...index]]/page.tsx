'use client'

/**
 * This route responsible for the Sanity Studio can be found at /studio
 */

import { NextStudio } from 'next-sanity/studio'
import config from '../../../sanity.config'


export default function StudioPage() {
    return <NextStudio config={config} />
}
