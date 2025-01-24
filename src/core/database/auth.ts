import { initAuthCreds, BufferJSON } from "baileys";
import { Session } from "./session";

interface KeyMap {
    [key: string]: string;
}

interface Keys {
    [key: string]: {
        [id: string]: unknown;
    };
}

export class useDatabaseAuth {
    private Session: Session;
    private readonly KEY_MAP: KeyMap = {
        "pre-key": "preKeys",
        session: "sessions",
        "sender-key": "senderKeys",
        "app-state-sync-key": "appStateSyncKeys",
        "app-state-sync-version": "appStateVersions",
        "sender-key-memory": "senderKeyMemory",
    };

    constructor(private readonly sessionId: string) {
        this.Session = new Session();
    }

    getAuthFromDatabase = async () => {
        let creds;
        let keys: Keys = {};
        const storedCreds = await this.Session.getSession(this.sessionId);

        if (storedCreds?.session) {
            const parsedCreds = JSON.parse(storedCreds.session, BufferJSON.reviver);
            creds = parsedCreds.creds;
            keys = parsedCreds.keys;
        } else {
            if (!storedCreds) {
                await this.Session.createSession(this.sessionId);
            }
            creds = initAuthCreds();
        }

        const saveState = async () => {
            const session = JSON.stringify(
                { creds, keys },
                BufferJSON.replacer,
                2
            );
            await this.Session.updateSession(this.sessionId, session);
        };

        const saveCreds = () => {
            return saveState();
        };

        const clearState = async () => {
            await this.Session.deleteSession(this.sessionId);
        };

        return {
            state: {
                creds,
                keys: {
                    get: (type: string, ids: string[]) => {
                        const key = this.KEY_MAP[type];
                        return ids.reduce((dict: { [key: string]: any }, id) => {
                            let value = keys[key]?.[id];
                            if (value) {
                                dict[id] = value;
                            }
                            return dict;
                        }, {});
                    },
                    set: (data: { [key: string]: { [id: string]: any } }) => {
                        for (const _key in data) {
                            const key = this.KEY_MAP[_key];
                            keys[key] = keys[key] || {};
                            Object.assign(keys[key], data[_key]);
                        }
                        saveState();
                    },
                },
            },
            saveState,
            saveCreds,
            clearState,
        };
    };
}
