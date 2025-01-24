import { ISession, SessionModel } from './models/sessions.model';

export class Session {
    async getSession(sessionId: string): Promise<ISession | null> {
        return SessionModel.findOne({ sessionId });
    }

    async createSession(sessionId: string): Promise<ISession> {
        return SessionModel.create({ sessionId, session: '' });
    }

    async updateSession(sessionId: string, session: string): Promise<ISession | null> {
        return SessionModel.findOneAndUpdate(
            { sessionId },
            { session },
            { new: true }
        );
    }

    async deleteSession(sessionId: string): Promise<boolean> {
        const result = await SessionModel.deleteOne({ sessionId });
        return result.deletedCount > 0;
    }
}
