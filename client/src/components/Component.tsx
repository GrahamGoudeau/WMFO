import * as React from 'react';
import { newObject } from '../ts/onClickUtils';
import { AuthState } from '../ts/authState';
import { browserHistory } from 'react-router';

export default abstract class Component<P, S> extends React.Component<P, S> {
    async setStateAsync(newState: S): Promise<any> {
        return new Promise((resolve, reject) => {
            this.setState(newState, () => {
                resolve();
            });
        });
    }

    updateState(key: keyof S, value: S[keyof S]) {
        const update: any = {};
        update[key] = value;
        this.setState(newObject(this.state, update));
    }

    async updateStateAsync(key: keyof S, value: S[keyof S]) {
        const update: any = {};
        update[key] = value;
        await this.setStateAsync(newObject(this.state, update));
    }

    constructor(props: P) {
        super(props);
        const p: { location?: { pathname: string }} = props;
        AuthState.getInstance().updateState().then(s => {
            if (s.isNothing() && p.location && p.location.pathname !== '/' && p.location.pathname.indexOf('register') === -1) {
                browserHistory.push('/');
                return;
            }
        }).catch(e => browserHistory.push('/'));
    }
}
