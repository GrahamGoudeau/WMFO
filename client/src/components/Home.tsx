import * as React from "react";
import Maybe from "../ts/maybe";
import { EXEC_BOARD_PERMISSIONS, AuthState, CommunityMemberRecord } from "../ts/authState";
import { ProfileView } from "./ProfileView";
import Component from "./Component";
import { FormComponent, ErrorState } from "./Form";
import WMFORequest from "../ts/request";

interface HomeState {
    user: Maybe<CommunityMemberRecord>;
    querying: boolean;
}

interface LoginPromptState {
    email: string;
    password: string;
}

class LoginPrompt extends FormComponent<{}, LoginPromptState> {
    private LOGIN_URL = '/api/account/login';
    constructor(props: any) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.state = {
            email: '',
            password: ''
        };
    }

    async handleSubmit(event: any) {
        event.preventDefault();
        const req: WMFORequest = WMFORequest.getInstance();
        try {
            const response = await req.POST(this.LOGIN_URL, {
                email: this.state.email,
                password: this.state.password
            });
            req.setAuthHeader(response.data.authToken);
            AuthState.getInstance().authorize(response.data.userData);
        } catch (e) {
            console.log('oops', e);
        }
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit}>
                <input type="email" id="email" placeholder="email" onChange={this.handleChange.bind(this)}/>
                <input type="password" id="password" placeholder="password" onChange={this.handleChange.bind(this)}/>
                <input type="submit" value="Log In" onChange={this.handleChange.bind(this)}/>
            </form>
        );
    }
}

export class Home extends Component<{}, HomeState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            user: AuthState.getInstance().getState(),
            querying: true
        };
        AuthState.getInstance().addListener((m: Maybe<CommunityMemberRecord>) => {
            this.setState({ user: m, querying: false });
        });

        AuthState.getInstance().updateState().then(m => this.setState({ user: m, querying: false }));
    }

    async componentDidMount() {
        this.setState({
            user: await AuthState.getInstance().updateState(),
            querying: false,
        });
    }

    render() {
        const homePage = this.state.user.caseOf({
            nothing: () => (<LoginPrompt/>),
            just: (m: CommunityMemberRecord) =>
                (<ProfileView isExecBoardManaging={false} profileData={m}/>)
        });
        return (
            <div style={{color: 'white'}}>
                {this.state.querying ? null : homePage}
            </div>
        );

    }
}

