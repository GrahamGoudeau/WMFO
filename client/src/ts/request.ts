import { browserHistory } from "react-router";
import { AuthState } from "./authState";
declare var $: any;

export default class WMFORequest {
    private static INSTANCE: WMFORequest = null;

    private readonly globalHeaders: {
        [key: string]: string
    } = {};
    public static readonly AUTH_HEADER: string = 'x-wmfo-auth';

    private constructor() {}
    static getInstance(): WMFORequest {
        if (this.INSTANCE == null) {
            this.INSTANCE = new WMFORequest();
        }
        return this.INSTANCE;
    }

    setGlobalHeader(header: string, value: string) {
        this.globalHeaders[header] = value;
    }

    removeGlobalHeader(header: string) {
        delete this.globalHeaders[header];
    }

    setAuthHeader(value: string) {
        this.globalHeaders[WMFORequest.AUTH_HEADER] = value;
        if (window.localStorage) {
            window.localStorage[WMFORequest.AUTH_HEADER] = value;
        }
    }

    removeAuthHeader() {
        delete this.globalHeaders[WMFORequest.AUTH_HEADER];
        if (window.localStorage) {
            window.localStorage[WMFORequest.AUTH_HEADER] = '';
        }
    }

    getAuthHeader() {
        return this.globalHeaders[WMFORequest.AUTH_HEADER];
    }

    async POST(url: string, data?: any, headers?: { [headers: string]: string }) {
        try {
            return await $.ajax({
                url: url,
                method: 'POST',
                headers: Object.assign({}, this.globalHeaders, headers ? headers : {}),
                dataType: 'json',
                data: data ? data : {}
            });
        } catch (e) {
            if (e.status === 401) {
                await AuthState.getInstance().deauthorize();
                browserHistory.push('/');
                throw e;
            }
            throw e;
        }
    }

    async GET(url: string, headers?: { [headers: string]: string }) {
        try {
            return await $.ajax({
                url: url,
                method: 'GET',
                headers: Object.assign({}, this.globalHeaders, headers ? headers : {})
            });
        } catch (e) {
            if (e.status === 401) {
                await AuthState.getInstance().deauthorize();
                browserHistory.push('/');
                throw e;
            }
            throw e;
        }
    }
}
