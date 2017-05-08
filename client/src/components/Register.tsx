import * as React from "react";
import { browserHistory } from "react-router";
import Maybe from "../ts/maybe";
import { AuthState, CommunityMemberRecord } from "../ts/authState";
import Component from "./Component";
import { FormComponent, ErrorState } from "./Form";
import WMFORequest from "../ts/request";

interface RegisterState {
    code: Maybe<string>;
    email: string;
    badCode: boolean;
};

interface RegisterProps {
    params: {
        code: string;
    }
};

export default class WMFORegister extends FormComponent<RegisterProps, RegisterState> {
    private static readonly GET_UNCONFIRMED_ACCOUNT_URL: string = '/api/account/getUnconfirmedAccount';

    constructor(props: any) {
        super(props);
        if (AuthState.getInstance().getState().isJust()) {
            browserHistory.push('/');
        }
        console.log(this.props);
        const uuidRegex: RegExp = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;

        this.state = {
            code: uuidRegex.test(this.props.params.code) ?
                Maybe.just<string>(this.props.params.code) :
                Maybe.nothing<string>(),
            email: '',
            badCode: false,
        };
    }

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
                    console.log('could not get email from code');
                    await this.updateState('badCode', true);
                }
            }
        });
    }

    render() {
        let contents;
        if (!this.state.badCode && this.state.code.isJust()) {
            contents = (
                <form onSubmit={this.handleSubmit.bind(this)}>
                    Creating account for: {this.state.email}
                    <br/>
                </form>
            );
        } else {
            contents = (
                <div>{'Unrecognized code :('}</div>
            );
        }
        return (
            <div>{contents}</div>
        );
    }
}
