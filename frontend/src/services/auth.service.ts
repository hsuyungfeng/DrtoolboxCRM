import { http } from './api';
import type { LoginDto, LoginResponseDto, UserProfile, RefreshTokenDto } from '@/types/auth';

export const authService = {
  login: (credentials: LoginDto) =>
    http.post<LoginResponseDto>('/auth/login', credentials),

  logout: () =>
    http.post('/auth/logout'),

  profile: () =>
    http.get<UserProfile>('/auth/profile'),

  refreshToken: () =>
    http.post<RefreshTokenDto>('/auth/refresh'),
};
