import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'], // Запрещаем ботам индексировать админку и API
    },
    sitemap: 'https://ТВОЙ_ДОМЕН.com/sitemap.xml', // Замени на свой, если есть
  }
}