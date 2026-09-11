import { Model } from 'mongoose';
import { connectDB } from './db';

export async function findAll<T>(model: Model<T>) {
    await connectDB();
    return model.find().sort({ createdAt: -1 }).lean();
}

export async function findById<T>(model: Model<T>, id: string) {
    await connectDB();
    return model.findById(id).lean();
}

export async function create<T>(model: Model<T>, data: Record<string, unknown>) {
    await connectDB();
    return model.create(data as T);
}

export async function update<T>(model: Model<T>, id: string, data: Record<string, unknown>) {
    await connectDB();
    return model.findByIdAndUpdate(id, data, { new: true }).lean();
}

export async function remove<T>(model: Model<T>, id: string) {
    await connectDB();
    return model.findByIdAndDelete(id).lean();
}