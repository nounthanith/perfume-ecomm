import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define MONGODB_URI in your .env.local');
}

const cached = (global as { mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }).mongoose ??= {
    conn: null,
    promise: null,
};

export async function connectDB() {
    if (cached.conn) return cached.conn;

    cached.promise ??= mongoose.connect(MONGODB_URI!).then((db) => {
        console.log('MongoDB connected');
        return db;
    });

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        throw error;
    }

    return cached.conn;
}