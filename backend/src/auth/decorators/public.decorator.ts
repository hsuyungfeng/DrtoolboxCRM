import { SetMetadata } from "@nestjs/common";
import { IS_PUBLIC_KEY } from "../guards/jwt-auth.guard";

/**
 * 標記路由為公開（不需要 JWT 認證）
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
