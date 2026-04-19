export interface LoginDto {
  username: string;
  password: string;
  clinicId: string;
}

export interface LoginResponseDto {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  role: string;
  clinicId: string;
}

export interface RefreshTokenDto {
  accessToken: string;
  tokenType: 'Bearer';
}
