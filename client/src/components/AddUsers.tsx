import * as React from "react";
import Maybe from "../ts/maybe";
import { PermissionLevel, AuthState, CommunityMemberRecord } from "../ts/authState";
import Component from "./Component";
import { FormComponent, ErrorState } from "./Form";
import WMFORequest from "../ts/request";
import { browserHistory } from "react-router";

interface AddUsersState {
    signedIn: boolean;
    addSingle: boolean;
}

interface AddSingleUserFormState {
    djEmail: string;
    isStudentDj: boolean;
    isCommunityDj: boolean;
    djConflict: boolean;
    noPermissions: boolean;
    hasSubmitted: boolean;
    error: boolean;
    message: string;
}

class AddSingleUserForm extends FormComponent<{}, AddSingleUserFormState> {
    private readonly ADD_SINGLE_USER_URL: string = '/api/exec/addPendingMembers';
    constructor(props: any) {
        super(props);
        this.state = {
            djEmail: '',
            isStudentDj: false,
            isCommunityDj: false,
            djConflict: false,
            noPermissions: false,
            hasSubmitted: false,
            error: false,
            message: ''
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
        await this.updateStateAsync('hasSubmitted', true);
        try {
            console.log('about to send');
            const response = await WMFORequest.getInstance().POST(this.ADD_SINGLE_USER_URL, {
                pendingMembers: [{
                    email: this.state.djEmail,
                    permissionLevels: this.buildPermissionArray()
                }]
            });
            console.log('response:', response);
            await this.updateStateAsync('error', false);
            await this.updateStateAsync('message', `Successfully added user ${this.state.djEmail}! They should receive an email soon.  If not, send them their unique URL from the Pending Members tab.`);
            this.setState({
                djEmail: '',
                isStudentDj: false,
                isCommunityDj: false,
                djConflict: false,
                noPermissions: false,
                hasSubmitted: true,
                error: false,
                message: this.state.message
            });
        } catch (e) {
            console.log(e);
            console.log('error response:', e.status);
            await this.updateStateAsync('error', true);
            await this.updateStateAsync('message', 'An error occurred! Please make sure that the email is spelled correctly. If this keeps happening, contact the webmaster for help.');
        }
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit.bind(this)}>
            <p style={{ color: '#333', textAlign: 'center' }}>Adding one user</p>
                <label htmlFor="djEmail">New User Email</label>
                <input type="email" value={this.state.djEmail} id="djEmail" onChange={this.handleChange.bind(this)}/>
                <br/>
                <label htmlFor="isStudentDj">Student DJ</label>
                <input key={this.state.isStudentDj ? 0 : 1} name="isStudentDj" type="checkbox" id="isStudentDj" onChange={this.handleChange.bind(this)} checked={this.state.isStudentDj}/>

                <br/>
                <label htmlFor="isCommunityDj">Community DJ</label>
                <input key={this.state.isCommunityDj ? 2 : 3} name="isCommunityDj" type="checkbox" id="isCommunityDj" onChange={this.handleChange.bind(this)} checked={this.state.isCommunityDj}/>
                <br/>
                <input type="submit" value="Submit"/>
                <p style={{
                    display: this.state.hasSubmitted ? 'block' : 'none'
                }}>{this.state.message}</p>
            </form>
        );
    }
}

export class AddUsers extends Component<{}, AddUsersState> {
    private static addedListener: boolean = false;
    constructor(props: any) {
        super(props);
        this.state = {
            signedIn: AuthState.getInstance().getState().isJust(),
            addSingle: true,
        };

        if (!AddUsers.addedListener) {
            AuthState.getInstance().addListener((m: Maybe<CommunityMemberRecord>) => this.updateState('signedIn', m.isJust()));
            AddUsers.addedListener = true;
        }
    }

    async componentDidMount() {
        await AuthState.getInstance().updateState();
        this.updateState('signedIn', AuthState.getInstance().getState().isJust());
    }

    changeForm(addSingle: boolean) {
        console.log('running', addSingle);
        this.updateState('addSingle', addSingle);
    }

    render() {
        if (!this.state.signedIn) return null;
        const content = this.state.addSingle ? <AddSingleUserForm/> : null;
        return (
            <div>
                <ul style={{
                    marginTop: '5%',
                    marginBottom: '2%',
                }}>
                    <li><a href="javascript:void(0);" onClick={(event) => this.changeForm.bind(this)(true)}>Add Single User</a></li>
                    <li><a href="javascript:void(0);" onClick={(event) => this.changeForm.bind(this)(false)}>Add Many Users</a></li>
                </ul>
                {content}
            </div>
        );
    }
}
