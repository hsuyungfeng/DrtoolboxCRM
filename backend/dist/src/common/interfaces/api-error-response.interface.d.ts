export interface ApiErrorResponse {
    statusCode: number;
    message: string;
    errorCode: string;
    timestamp: string;
    path?: string;
    details?: Record<string, any>;
    errors?: Array<{
        field: string;
        message: string;
        constraint?: string;
    }>;
}
