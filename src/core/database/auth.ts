import {
  initAuthCreds,
  BufferJSON,
  AuthenticationState,
  SignalDataTypeMap,
} from "baileys";
import { Session } from "./session";

interface KeyMap {
  [key: string]: string;
}

interface Keys {
  [key: string]: {
    [id: string]: unknown;
  };
}

interface StoredValue {
  [id: string]: SignalDataTypeMap[keyof SignalDataTypeMap];
}

interface KeyData {
  [key: string]: StoredValue;
}

interface AuthState {
  creds: AuthenticationState["creds"];
  keys: Keys;
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
    let creds: AuthenticationState["creds"];
    let keys: Keys = {};
    const storedCreds = await this.Session.getSession(this.sessionId);

    if (storedCreds?.session) {
      const parsedCreds = JSON.parse(
        storedCreds.session,
        BufferJSON.reviver,
      ) as AuthState;
      creds = parsedCreds.creds;
      keys = parsedCreds.keys;
    } else {
      if (!storedCreds) {
        await this.Session.createSession(this.sessionId);
      }
      creds = initAuthCreds();
    }

    const saveState = async () => {
      const session = JSON.stringify({ creds, keys }, BufferJSON.replacer, 2);
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
          get: async <T extends keyof SignalDataTypeMap>(
            type: T,
            ids: string[],
          ) => {
            const key = this.KEY_MAP[type];
            return ids.reduce(
              (dict: { [_: string]: SignalDataTypeMap[T] }, id) => {
                const value = keys[key]?.[id] as SignalDataTypeMap[T];
                if (value) {
                  dict[id] = value;
                }
                return dict;
              },
              {},
            );
          },
          set: (data: KeyData): void => {
            for (const _key in data) {
              const key = this.KEY_MAP[_key];
              keys[key] = keys[key] || {};
              Object.assign(keys[key], data[_key]);
            }
            void saveState();
          },
        },
      },
      saveState,
      saveCreds,
      clearState,
    };
  };
}
