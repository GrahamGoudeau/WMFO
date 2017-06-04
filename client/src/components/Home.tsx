import * as React from "react";
import Maybe from "../ts/maybe";
import { EXEC_BOARD_PERMISSIONS, AuthState, CommunityMemberRecord } from "../ts/authState";
import { ProfileView } from "./ProfileView";
import Component from "./Component";
import { FormComponent, ErrorState } from "./Form";
import WMFORequest from "../ts/request";
import WMFOStyles from "../ts/styles";

interface HomeState {
    user: Maybe<CommunityMemberRecord>;
    querying: boolean;
}

interface LoginPromptState {
    email: string;
    password: string;
    error: boolean;
    errorMessage: string;
}

class LoginPrompt extends FormComponent<{}, LoginPromptState> {
    private LOGIN_URL = '/api/account/login';
    constructor(props: any) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.state = {
            email: '',
            password: '',
            error: false,
            errorMessage: '',
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
            console.log('exception', e);
            await this.updateStateAsync('error', true);
            await this.updateStateAsync('errorMessage', 'Could not log in- make sure your email and password are both correct.');
        }
    }

    render() {
        return (
            <div style={WMFOStyles.FORM_STYLE}>
                <form onSubmit={this.handleSubmit}>
                    <input style={WMFOStyles.TEXT_INPUT_STYLE} type="email" id="email" placeholder="email" onChange={this.handleChange.bind(this)}/>
                    <input style={WMFOStyles.TEXT_INPUT_STYLE} type="password" id="password" placeholder="password" onChange={this.handleChange.bind(this)}/>
                    <button style={WMFOStyles.BUTTON_STYLE} onClick={this.handleSubmit}>Log In</button>
                    <p style={{ padding: '5%', textAlign: 'center', display: this.state.error ? 'block' : 'none' }}>
                        {this.state.errorMessage}
                    </p>
                </form>
            </div>
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
                (<ProfileView onUpdate={_ => null} isExecBoardManaging={false} profileData={m}/>)
        });
        return (
            <div>
                {this.state.querying ? null : homePage}
            </div>
        );

    }
}

