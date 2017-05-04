import * as React from "react";
import Maybe from "../ts/maybe";
import { AuthState, CommunityMemberRecord } from "../ts/authState";
import Component from "./Component";

interface HomeState {
    user: Maybe<CommunityMemberRecord>;
    querying: boolean;
}

export class Home extends Component<{}, HomeState> {
    constructor() {
        super();
        this.state = {
            user: AuthState.getInstance().getState(),
            querying: true
        };
        AuthState.getInstance().addListener((m: Maybe<CommunityMemberRecord>) => {
            setTimeout(() => {
                this.setState({ user: m, querying: false });
            }, 100);
        });
        setTimeout(() => {
            AuthState.getInstance().updateState().then(m => this.setState({ user: m, querying: false }));
        }, 100);
    }

    render() {
        const homePage = this.state.user.caseOf({
            nothing: () => (<div>PLEASE LOG IN</div>),
            just: (m: CommunityMemberRecord) => (<div>{m.id}</div>)
        });
        return (
            <div style={{color: 'white'}}>
                {this.state.querying ? null : homePage}
            </div>
        );

    }
}

