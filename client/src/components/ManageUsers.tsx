import * as React from "react";
import Maybe from "../ts/maybe";
import { EXEC_EMAILS, PermissionLevel, AuthState, CommunityMemberRecord } from "../ts/authState";
import Component from "./Component";
import WMFORequest from "../ts/request";
import { browserHistory } from "react-router";
import { ProfileView } from "./ProfileView";
import * as ReactModal from "react-modal";

interface AllUserInfo extends CommunityMemberRecord {
    dateLastAgreementSigned: Date;
    confirmedVolunteerHours: number;
    pendingVolunteerHours: number;
    numShowsHosted: number;
}

interface ManageUsersState {
    querying: boolean;
    users: AllUserInfo[];
    emailFilter: string;
    nameFilter: string;
    modalOpen: boolean;
    modalContents: JSX.Element;
    showDisabled: boolean;
    showCommunityDJs: boolean;
    showStudentDJs: boolean;
};

export class ManageUsers extends Component<{}, ManageUsersState> {
    private readonly ALL_USER_URL: string = '/api/exec/manageUsers';
    constructor(props: {}) {
        super(props);
        this.state = {
            querying: true,
            users: [],
            emailFilter: '',
            nameFilter: '',
            modalOpen: false,
            modalContents: null,
            showDisabled: false,
            showCommunityDJs: true,
            showStudentDJs: true,
        };
    }

    private async displayInfo(user: AllUserInfo) {
        //await this.updateStateAsync('modalContents', <div>{user.id}</div>);
        const modalContents = (
            <div style={{ padding: '2%' }}>
                <p>Email: {user.email}</p>
                <p>User ID: {user.id}</p>
                <p>User Name: {user.firstName} {user.lastName}</p>
                <p>Shows Hosted: {user.numShowsHosted}</p>
                <p>Confirmed Volunteer Hours: {user.confirmedVolunteerHours}</p>
                {user.pendingVolunteerHours > 0 ? <p>Pending Volunteer Hours: {user.pendingVolunteerHours}</p> : null}
                <p>Permissions: {user.permissionLevels} (<a href="javascript:void(0);">Edit</a>)</p>
            </div>
        );

        await this.setStateAsync({
            querying: false,
            users: this.state.users,
            emailFilter: this.state.emailFilter,
            showCommunityDJs: this.state.showCommunityDJs,
            showStudentDJs: this.state.showStudentDJs,
            nameFilter: this.state.nameFilter,
            showDisabled: this.state.showDisabled,
            modalOpen: true,
            //modalContents: modalContents
            modalContents: <ProfileView onUpdate={((newUser: CommunityMemberRecord) => {
                Object.keys(newUser).forEach((key: keyof CommunityMemberRecord) => {
                    user[key] = newUser[key];
                });
                if (AuthState.getInstance().getState().valueOr(null).email === newUser.email) {
                    alert('You have edited your own profile. You must now log in again for security purposes.');
                    AuthState.getInstance().deauthorize();
                    browserHistory.push('/');
                } else {
                    this.setState(this.state); // force re-render just in case
                }
            }).bind(this)} isExecBoardManaging={true} profileData={user}/>
        });
    }

    private async handleEmailFilterChange(e: any) {
        e.preventDefault();
        await this.updateStateAsync('emailFilter', e.target.value);
    }

    private async handleNameFilterChange(e: any) {
        e.preventDefault();
        await this.updateStateAsync('nameFilter', e.target.value);
    }

    async componentDidMount() {
        try {
            const response = await WMFORequest.getInstance().GET(this.ALL_USER_URL);
            await this.updateStateAsync('users', response.data.allUserInfo);
            await this.updateStateAsync('querying', false);
        } catch (e) {
            console.log('err', e);
        }
    }

    render() {
        const mainBoxStyle = {
            color: '#333',
            backgroundColor: '#fefefe',
            borderRadius: '7px',
            padding: '1%',
            marginTop: '2%',
            height: '100%',
            margin: '2%',
        };
        const entryStyle = {
            marginTop: '2%',
            padding: '1%',
            borderBottom: 'solid',
            borderBottomWidth: '1px',
        };

        //if (this.state.querying) return null;

        const userList = this.state.querying ? null : this.state.users
            .filter(user => this.state.showDisabled || user.active)
            .filter(user => this.state.showCommunityDJs || user.permissionLevels.indexOf('COMMUNITY_DJ') === -1)
            .filter(user => this.state.showStudentDJs || user.permissionLevels.indexOf('STUDENT_DJ') === -1)
            .filter(user => EXEC_EMAILS.indexOf(user.email) === -1)
            .filter(user =>
                this.state.emailFilter.length === 0 ||
                    user.email.indexOf(this.state.emailFilter) !== -1)
            .filter((user: AllUserInfo) =>
                this.state.nameFilter.length === 0 ||
                    `${user.firstName} ${user.lastName}`.toLowerCase().indexOf(this.state.nameFilter.toLowerCase()) !== -1)
            .map((user: AllUserInfo) => (
                <div style={entryStyle}>
                    <p style={{fontWeight: 'bold'}}>{user.email}</p>
                    <p>Name: {user.firstName} {user.lastName}</p>
                    <p>Confirmed Volunteer Hours: {user.confirmedVolunteerHours}</p>
                    <p>Shows Hosted: {user.numShowsHosted}</p>
                    {this.state.showDisabled ? <p>Active: {user.active.toString()}</p> : null}
                    <a href="javascript:void(0)" onClick={_ => this.displayInfo.bind(this)(user)}>Manage user</a>
                </div>
            ));
        return (
            <div>
                <div style={Object.assign({}, mainBoxStyle, { marginLeft: '20%', display: 'inline-block', height: '100%' })}>
                    <h3>All Users</h3>
                    Filter by email: <input type="text" onChange={this.handleEmailFilterChange.bind(this)} value={this.state.emailFilter}/>
                    <br/>
                    Filter by name: <input type="text" onChange={this.handleNameFilterChange.bind(this)} value={this.state.nameFilter}/>
                    <br/>
                    Show non-active users: <input type="checkbox" onChange={(_: any) => this.updateState('showDisabled', !this.state.showDisabled)} checked={this.state.showDisabled}/>
                    <br/>
                    Show community DJs: <input type="checkbox" onChange={(_: any) => this.updateState('showCommunityDJs', !this.state.showCommunityDJs)} checked={this.state.showCommunityDJs}/>
                    <br/>
                    Show student DJs: <input type="checkbox" onChange={(_: any) => this.updateState('showStudentDJs', !this.state.showStudentDJs)} checked={this.state.showStudentDJs}/>
                    <br/>
                    <button onClick={async _ => {
                        await this.updateStateAsync('emailFilter', '');
                        await this.updateStateAsync('nameFilter', '');
                        await this.updateStateAsync('showDisabled', false);
                    }}>Reset Filters</button>
                    <hr/>
                </div>
                <div style={Object.assign({}, mainBoxStyle, { width: '30%', display: 'inline-block', height: '100%', overflow: 'scroll', verticalAlign: 'top' })}>
                    {userList == null ? 'Loading...' :
                        userList.length > 0 ? userList : 'No matches'}
                </div>
                <ReactModal isOpen={this.state.modalOpen} contentLabel="DJ Details">
                    <button onClick={_ => this.updateState('modalOpen', false)} style={{padding: '0.5%'}}>Close</button>
                    <div style={{
                        marginTop: '2%',
                        border: 'solid',
                        borderWidth: '1px',
                    }}>
                        {this.state.modalContents}
                    </div>
                </ReactModal>
            </div>
        );
    }
}
