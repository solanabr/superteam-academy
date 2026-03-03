export interface ApiResponse<D = unknown> {
  success: boolean
  message: string
  data?: D
}
