export interface ServiceResponse<T> {
	success: boolean;
	data?: T;
	error?: string | { code: string; message: string };
}

export interface PaginationParams {
	page: number;
	limit: number;
}

export interface PaginatedResponse<T> extends ServiceResponse<T[]> {
	total: number;
	page: number;
	limit: number;
}
