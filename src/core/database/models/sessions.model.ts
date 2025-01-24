import { Schema, model, Document } from 'mongoose';

export interface ISession extends Document {
    sessionId: string;
    session: string;
    createdAt: Date;
    updatedAt: Date;
}

const SessionSchema = new Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    session: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
});

export const SessionModel = model<ISession>('sessions', SessionSchema); 