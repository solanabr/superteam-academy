import type { PayloadCourse, PayloadResponse } from '@/libs/types/course.types'
import { fetchAPI } from './index'

export const coursesAPI = {
  find: (params?: string) =>
    fetchAPI<PayloadResponse<PayloadCourse>>(
      `/courses${params ? `?${params}` : ''}`,
    ),

  findBySlug: (slug: string) =>
    fetchAPI<PayloadResponse<PayloadCourse>>(
      `/courses?where[slug][equals]=${slug}&depth=1&limit=1`,
    ),

  findById: (id: string) => fetchAPI<PayloadCourse>(`/courses/${id}?depth=1`),

  findPublished: () =>
    fetchAPI<PayloadResponse<PayloadCourse>>(
      `/courses?where[status][equals]=published&sort=createdAt&limit=100&depth=1`,
    ),
}
