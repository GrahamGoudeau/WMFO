import * as React from "react";
import { Link, browserHistory } from "react-router";
import Maybe from "../ts/maybe";
import { PermissionLevel, AuthState, CommunityMemberRecord } from "../ts/authState";
import Component from "./Component";
import { FormComponent, ErrorState } from "./Form";
import WMFORequest from "../ts/request";
import WMFOStyle from "../ts/styles";

interface RegisterState {
    code: Maybe<string>;
    email: string;
    badCode: boolean;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
    passwordMismatch: boolean;
    passwordNotEntered: boolean;
};

interface RegisterProps {
    params: {
        code: string;
    }
};

export default class WMFORegister extends FormComponent<RegisterProps, RegisterState> {
    private static readonly GET_UNCONFIRMED_ACCOUNT_URL: string = '/api/account/getUnconfirmedAccount';
    private static readonly REGISTER_URL: string = '/api/account/register';

    constructor(props: any) {
        super(props);
        if (AuthState.getInstance().getState().isJust()) {
            browserHistory.push('/');
        }
        const uuidRegex: RegExp = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;

        this.state = {
            code: uuidRegex.test(this.props.params.code) ?
                Maybe.just<string>(this.props.params.code) :
                Maybe.nothing<string>(),
            email: '',
            badCode: false,
            firstName: '',
            lastName: '',
            password: '',
            confirmPassword: '',
            passwordMismatch: false,
            passwordNotEntered: false,
        };
    }

    private readonly errorStates: ErrorState<RegisterState>[] = [{
        field: 'passwordMismatch',
        condition: (s: RegisterState) => s.password !== s.confirmPassword
    }, {
        field: 'passwordNotEntered',
        condition: (s: RegisterState) => s.password.length === 0
    }];

    async componentDidMount() {
        await this.state.code.caseOf({
            nothing: async () => null,
            just: async (code: string) => {
                const req: WMFORequest = WMFORequest.getInstance();

                try {
                    const response = await req.POST(WMFORegister.GET_UNCONFIRMED_ACCOUNT_URL, {
                        code: code
                    });
                    await this.updateState('badCode', false);
                    await this.updateState('email', response.data.email);
                } catch (e) {
                    await this.updateState('badCode', true);
                }
            }
        });
    }

    async handleSubmit(event: any) {
        event.preventDefault();
        if (await this.errorCheck(this.state, this.errorStates)) {
            console.log('error submitting');
            return;
        }
        try {
            const response = await WMFORequest.getInstance().POST(WMFORegister.REGISTER_URL, {
                firstName: this.state.firstName,
                lastName: this.state.lastName,
                code: this.state.code.valueOr(null),
                password: this.state.password
            });
            await AuthState.getInstance().deauthorize();
            WMFORequest.getInstance().setAuthHeader(response.data.authToken);
            await AuthState.getInstance().updateState(true);
            browserHistory.push('/');
        } catch (e) {
            console.log('err:', e);
        }
    }

    render() {
        let contents;
        if (!this.state.badCode && this.state.code.isJust()) {
            contents = (
                <form style={WMFOStyle.FORM_STYLE} onSubmit={this.handleSubmit.bind(this)}>
                    Creating account for: {this.state.email}
                    <br/>

                    <label htmlFor="firstName">First Name: </label>
                    <input type="text" id="firstName" placeholder="First Name" onChange={this.handleChange.bind(this)}/>
                    <br/>

                    <label htmlFor="lastName">Last Name: </label>
                    <input type="text" id="lastName" placeholder="Last Name" onChange={this.handleChange.bind(this)}/>
                    <br/>

                    <label htmlFor="password">Password: </label>
                    <input type="password" id="password" onChange={this.handleChange.bind(this)}/>
                    <br/>

                    <label htmlFor="confirmPassword">Retype Password: </label>
                    <input type="password" id="confirmPassword" onChange={this.handleChange.bind(this)}/>
                    <br/>

                    <input type="submit" value="Register"/>
                </form>
            );
        } else {
            contents = (
                <p style={{
                    color: '#333',
                    backgroundColor: '#fefefe',
                    borderRadius: '7px',
                    padding: '3%',
                    textAlign: 'center'
                }}>Looks like you got the wrong code! Have you already registered? Try signing in <Link to="/">here</Link></p>
            );
        }
        return (
            <div>{contents}</div>
        );
    }
}
