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

interface PopulateSpec {
    path: string;
    select?: string;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
    items: T[];
    pagination: PaginationMeta;
}

export async function paginateAll<T>(
    model: Model<T>,
    options: {
        page?: number;
        limit?: number;
        filter?: Record<string, unknown>;
        populate?: PopulateSpec[];
    } = {}
): Promise<PaginatedResult<T>> {
    await connectDB();

    const page = Math.max(1, Math.floor(options.page ?? 1));
    const limit = Math.max(1, Math.min(50, Math.floor(options.limit ?? 10)));
    const filter = options.filter ?? {};
    const skip = (page - 1) * limit;

    let query = model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    for (const pop of options.populate ?? []) {
        query = pop.select
            ? query.populate(pop.path, pop.select)
            : query.populate(pop.path);
    }

    const [items, totalItems] = await Promise.all([
        query.lean(),
        model.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return {
        items,
        pagination: {
            page,
            limit,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
}