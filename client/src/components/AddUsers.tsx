import * as React from "react";
import Maybe from "../ts/maybe";
import { AuthState, CommunityMemberRecord } from "../ts/authState";
import Component from "./Component";
import { FormComponent, ErrorState } from "./Form";
import WMFORequest from "../ts/request";
import { browserHistory } from "react-router";

interface AddUsersState {
    signedIn: boolean;
}

interface AddUserFormState {
    djFirstName: string;
}

class AddUserForm extends FormComponent<{}, AddUserFormState> {
    private readonly ADD_SINGLE_USER_URL: string = '/api/exec/addSingleUser';
    constructor(props: any) {
        super(props);
        this.state = {
            djFirstName: ''
        };
    }

    async handleSubmit(event: any) {
        event.preventDefault();
        alert(this.state.djFirstName);
        try {
            const response = await WMFORequest.getInstance().POST(this.ADD_SINGLE_USER_URL, {
                firstName: this.state.djFirstName
            });
            console.log('response:', response);
        } catch (e) {
            console.log('error response:', e);
        }
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit.bind(this)}>
                <input type="text" id="djFirstName" onChange={this.handleChange.bind(this)}/>
            </form>
        );
    }
}

export class AddUsers extends Component<{}, AddUsersState> {
    private static addedListener: boolean = false;
    constructor(props: any) {
        super(props);
        this.state = {
            signedIn: AuthState.getInstance().getState().isJust()
        };
        if (!this.state.signedIn) {
            browserHistory.push('/');
        }
        if (!AddUsers.addedListener) {
            AuthState.getInstance().addListener((m: Maybe<CommunityMemberRecord>) => {
                this.state = {
                    signedIn: m.isJust()
                };
            });
            AddUsers.addedListener = true;
        }
    }

    render() {
        const contents = (
            <div>here</div>
        );
        return (
            <AddUserForm/>
        );
    }
}

/*
interface AddUsersSecureState {
    signedIn: boolean;
}

export class AddUsersSecure extends Component<{}, 
*/
