import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  // Здесь мы перечисляем основные публичные страницы
  return [
    {
      url: 'https://ТВОЙ_ДОМЕН.com/en',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://ТВОЙ_ДОМЕН.com/es',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://ТВОЙ_ДОМЕН.com/pt-BR',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    //TODO:
    // В идеале тут нужно вытащить все курсы из БД и добавить их URL
  ]
}