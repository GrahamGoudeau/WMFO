import * as React from "react";
import Maybe from "../ts/maybe";
import { PermissionLevel, AuthState, CommunityMemberRecord } from "../ts/authState";
import Component from "./Component";
import { FormComponent, ErrorState } from "./Form";
import WMFORequest from "../ts/request";
import { browserHistory } from "react-router";

interface AddUsersState {
    signedIn: boolean;
}

interface AddSingleUserFormState {
    djFirstName: string;
    djLastName: string;
    djEmail: string;
    isStudentDj: boolean;
    isCommunityDj: boolean;
    djConflict: boolean;
    noPermissions: boolean;
}

class AddSingleUserForm extends FormComponent<{}, AddSingleUserFormState> {
    private readonly ADD_SINGLE_USER_URL: string = '/api/exec/addSingleUser';
    constructor(props: any) {
        super(props);
        this.state = {
            djFirstName: '',
            djLastName: '',
            djEmail: '',
            isStudentDj: false,
            isCommunityDj: false,
            djConflict: false,
            noPermissions: false,
        };
    }

    private readonly errorStates: ErrorState<AddSingleUserFormState>[] = [{
        field: 'djConflict',
        condition: (state: AddSingleUserFormState) => state.isStudentDj && state.isCommunityDj
    }, {
        field: 'noPermissions',
        condition: (state: AddSingleUserFormState) => !state.isStudentDj && !state.isCommunityDj
    }];

    private buildPermissionArray(): PermissionLevel[] {
        const permissions: PermissionLevel[] = [];
        if (this.state.isStudentDj) permissions.push('STUDENT_DJ');
        if (this.state.isCommunityDj) permissions.push('COMMUNITY_DJ');

        return permissions;
    }

    async handleSubmit(event: any) {
        event.preventDefault();
        if (await this.errorCheck(this.state, this.errorStates)) {
            console.log('error:', this.state);
            return;
        }
        try {
            const response = await WMFORequest.getInstance().POST(this.ADD_SINGLE_USER_URL, {
                firstName: this.state.djFirstName,
                lastName: this.state.djLastName,
                permissions: this.buildPermissionArray(),
            });
            console.log('response:', response);
        } catch (e) {
            console.log('error response:', e);
        }
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit.bind(this)}>
                <label htmlFor="djFirstName">First Name</label>
                <input type="text" id="djFirstName" onChange={this.handleChange.bind(this)}/>
                <br/>
                <label htmlFor="djLastName">Last Name</label>
                <input type="text" id="djLastName" onChange={this.handleChange.bind(this)}/>
                <br/>
                <label htmlFor="djEmail">New User Email</label>
                <input type="email" id="djEmail" onChange={this.handleChange.bind(this)}/>
                <br/>
                <label htmlFor="isStudentDj">Student DJ</label>
                <input key={this.state.isStudentDj ? 0 : 1} name="isStudentDj" type="checkbox" id="isStudentDj" onChange={this.handleChange.bind(this)} checked={this.state.isStudentDj}/>

                <br/>
                <label htmlFor="isCommunityDj">Community DJ</label>
                <input key={this.state.isCommunityDj ? 2 : 3} name="isCommunityDj" type="checkbox" id="isCommunityDj" onChange={this.handleChange.bind(this)} checked={this.state.isCommunityDj}/>
                <br/>
                <input type="submit" value="Submit"/>
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
        return (
            <AddSingleUserForm/>
        );
    }
}

/*
interface AddUsersSecureState {
    signedIn: boolean;
}

export class AddUsersSecure extends Component<{}, 
*/
