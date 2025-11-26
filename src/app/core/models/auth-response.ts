import { User } from './user';

export interface AuthResponse {
    token: string;
    refreshToken?: string; // Made optional as per backend discussion
    userInfo: User; // Changed from 'user' to 'userInfo' and type to User
}