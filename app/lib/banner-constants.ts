/**
 * Banner image constants — blur placeholders and paths.
 * Blur data URLs are tiny 16x5 WebP thumbnails (~50 bytes each) generated
 * by sharp, used with Next.js `placeholder="blur"` for instant previews.
 */

export const BANNER = {
    challenges: {
        light: {
            src: '/challenges/challenges_banner_light.webp',
            blur: 'data:image/webp;base64,UklGRjQAAABXRUJQVlA4ICgAAACwAQCdASoQAAUABUB8JaQAAiC6iHxAAP7x37JabixFSwXLdEEAyAAA',
        },
        dark: {
            src: '/challenges/challenges_banner_dark.webp',
            blur: 'data:image/webp;base64,UklGRj4AAABXRUJQVlA4IDIAAADQAQCdASoQAAUABUB8JaQAAv0lrnZ1YAD+7pomrN8lQw9R62qOOQHCi36dVGCZxQAAAA==',
        },
    },
    community: {
        src: '/community/community_banner.webp',
        blur: 'data:image/webp;base64,UklGRkwAAABXRUJQVlA4IEAAAADQAQCdASoQAAUABUB8JYgCdAEOJNuSQAD+13AlwtrISfVjqYNbHX6I0nPqMEOx4m3na4XJXEI7Tb3CoH5oHgAA',
    },
    achievements: {
        src: '/achievements/achievements_banner.webp',
        blur: 'data:image/webp;base64,UklGRkIAAABXRUJQVlA4IDYAAADwAQCdASoQAAUABUB8JYwCdAEPWT/U2gAA/jR60zcVGcfwPVZI6oYGedhY7fRSr7upEYTbAAA=',
    },
} as const;
