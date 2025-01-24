import mongoose from 'mongoose';

export * from './models/sessions.model';
export * from './session';
export * from './auth';

export async function connectDatabase(uri: string): Promise<void> {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}
