import { BaseException } from './base.exception';
export declare class NotFoundException extends BaseException {
    constructor(resource: string, resourceId?: string, details?: Record<string, any>);
}
