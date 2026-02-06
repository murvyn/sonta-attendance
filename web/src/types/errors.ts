export interface ApiError {
  response?: {
    data?: {
      message?: string;
      statusCode?: number;
    };
  };
  message: string;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const apiError = error as ApiError;
    return apiError.response?.data?.message || apiError.message || 'An unexpected error occurred';
  }
  return 'An unexpected error occurred';
}
