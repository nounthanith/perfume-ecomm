import { IUser } from '@/types/user.type';
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
    provider: string;
}

const UserSchema = new Schema<IUserDocument>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: {
            type: String,
            // Required ONLY if signing up through credentials (email/password)
            required: function (this: IUserDocument) {
                return this.provider === 'credentials';
            },
        },
        googleId: { type: String },
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        avatar: { type: String, default: '' },
        provider: { type: String, enum: ['credentials', 'google'], default: 'credentials' },
        emailVerified: { type: Boolean, default: false },
        otp: { type: String, select: false },
        otpExpires: { type: Date, select: false },
    },
    { timestamps: true }
);

// Prevent re-instantiating model on Next.js hot-reloads
const User: Model<IUserDocument> =
    mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default User;