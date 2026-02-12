export declare class LoginDto {
    username: string;
    password: string;
    clinicId: string;
}
export declare class LoginResponseDto {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    user: {
        id: string;
        username: string;
        name: string;
        role: string;
        clinicId: string;
    };
}
