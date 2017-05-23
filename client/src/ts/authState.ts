import Maybe from "./maybe";
import WMFORequest from "./request";

const permissionLevelStrings = {
    COMMUNITY_DJ: '',
    STUDENT_DJ: '',
    GENERAL_MANAGER: '',
    ASSISTANT_GENERAL_MANAGER: '',
    OPERATIONS_DIRECTOR: '',
    PROGRAMMING_DIRECTOR: '',
    SCHEDULING_COORDINATOR: '',
    VOLUNTEER_COORDINATOR: '',
    WEBMASTER: '',
}

export type PermissionLevel = keyof typeof permissionLevelStrings;

export function isPermissionLevel(s: string): s is PermissionLevel {
    return permissionLevelStrings.hasOwnProperty(s);
}

export const EXEC_BOARD_PERMISSIONS: PermissionLevel[] = [
    'GENERAL_MANAGER',
    'ASSISTANT_GENERAL_MANAGER',
    'OPERATIONS_DIRECTOR',
    'PROGRAMMING_DIRECTOR',
    'SCHEDULING_COORDINATOR',
    'VOLUNTEER_COORDINATOR'
];

export const DJ_PERMISSIONS: PermissionLevel[] = [
    'STUDENT_DJ',
    'COMMUNITY_DJ'
];

export const EXEC_EMAILS: string[] = [
    'gm@wmfo.org',
    'agm@wmfo.org',
    'pd@wmfo.org',
    'ops@wmfo.org',
];

export interface CommunityMemberRecord {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    active: boolean;
    tuftsId?: number;
    lastAgreementSigned?: number;
    permissionLevels: PermissionLevel[];
}

type AuthStateListener = (newAuthState: Maybe<CommunityMemberRecord>) => void;
type AsyncAuthStateListener = (newAuthState: Maybe<CommunityMemberRecord>) => Promise<void>;

export class AuthState {
    private static INSTANCE: AuthState = null;
    private constructor() {}
    private user: Maybe<CommunityMemberRecord> = Maybe.nothing<CommunityMemberRecord>();
    private sentInitialRequest: boolean = false;
    private readonly PROFILE_ENDPOINT = '/api/account/profile';
    private readonly listeners: AuthStateListener[] = [];
    private readonly asyncListeners: AsyncAuthStateListener[] = [];

    static getInstance() {
        if (this.INSTANCE == null) {
            this.INSTANCE = new AuthState();
        }
        return this.INSTANCE;
    }

    addListener(f: AuthStateListener) {
        this.listeners.push(f);
    }

    addAsyncListener(f: AsyncAuthStateListener) {
        this.asyncListeners.push(f);
    }

    private async broadcast() {
        this.asyncListeners.forEach(async f => {
            await f(this.user);
        });
        this.listeners.forEach(f => {
            f(this.user);
        });
    }

    async authorize(m: CommunityMemberRecord) {
        this.user = Maybe.just<CommunityMemberRecord>(m);
        await this.broadcast();
    }

    async deauthorize() {
        this.user = Maybe.nothing<CommunityMemberRecord>();
        await this.broadcast();
    }

    getState(): Maybe<CommunityMemberRecord> {
        return this.user;
    }

    async updateState(forceUpdate: boolean = false): Promise<Maybe<CommunityMemberRecord>> {
        const result = await this.user.caseOf({
            just: async (c: CommunityMemberRecord) => {
                return Maybe.just<CommunityMemberRecord>(c);
            },
            nothing: async () => {
                if (!forceUpdate && this.sentInitialRequest) {
                    return Maybe.nothing<CommunityMemberRecord>();
                }
                const req: WMFORequest = WMFORequest.getInstance();
                this.sentInitialRequest = true;
                if (req.getAuthHeader() == null && window.localStorage != null) {
                    const storedToken: string = window.localStorage[WMFORequest.AUTH_HEADER];
                    req.setAuthHeader(storedToken != null ? storedToken : '');
                }

                try {
                    const response = await (WMFORequest.getInstance()).POST(this.PROFILE_ENDPOINT);
                    this.authorize(response.data);
                    return Maybe.just<CommunityMemberRecord>(response.data);
                } catch (e) {
                    if (e.status !== 401) throw e;
                    return Maybe.nothing<CommunityMemberRecord>();
                }
            }
        });
        this.user = result;
        await this.broadcast();
        return this.user;
    }
}
