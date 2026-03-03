import { ApiResponse } from '@/interfaces'

export const apiResponse = <D = unknown>(
  success: boolean,
  message: string,
  data?: D,
): ApiResponse<D> => {
  return {
    success,
    message,
    data,
  }
}

// export const httpRequest = (setLoading?: (loading: boolean) => void) => {
//   console.log('ENV.API_URL', ENV.API_URL)
//   // Here we set the base URL for all requests made to the api
//   const api: AxiosInstance = axios.create({
//     baseURL: ENV.API_URL,
//   })

//   // We set an interceptor for each request to
//   // include Bearer token to the request if user is logged in
//   api.interceptors.request.use(async (config) => {
//     // set loading true on request if isLoading is not null
//     setLoading?.(true)

//     // Automatically get token from cookies and add to Authorization header
//     const token = AuthCookieService.getToken()
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`
//     }

//     return config
//   })

//   // This runs before any response is return
//   api.interceptors.response.use(
//     (response) => {
//       // set loading false if isLoading is not null
//       setLoading?.(false)

//       return response
//     },
//     (error) => {
//       // set loading false if isLoading is not null
//       setLoading?.(false)

//       // throw error
//       return Promise.reject(error)
//     },
//   )

//   return api
// }
