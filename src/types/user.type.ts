export interface IUser {
    _id: string;
    name: string;
    email: string;
    password?: string; // Optional for Google OAuth users
    googleId?: string; // Unique Google user ID (sub)
    role: 'user' | 'admin'; // Specific roles instead of generic string
    avatar?: string; // Optional image URL
    authProvider: 'local' | 'google'; // Tracks registration method
    emailVerified?: boolean; // Whether the email has been verified via OTP
    otp?: string; // One-time password for email verification
    otpExpires?: Date; // Expiry date of the OTP
    createdAt?: Date;
    updatedAt?: Date;
}