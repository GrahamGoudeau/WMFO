import * as React from "react";
import Maybe from "../ts/maybe";
import { EXEC_EMAILS, PermissionLevel, AuthState, CommunityMemberRecord } from "../ts/authState";
import Component from "./Component";
import WMFORequest from "../ts/request";
import { browserHistory } from "react-router";
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
        };
    }

    private async displayInfo(user: AllUserInfo) {
        //await this.updateStateAsync('modalContents', <div>{user.id}</div>);
        const modalContents = (
            <div>
                {user.id}
            </div>
        );
        await this.setStateAsync({
            querying: false,
            users: this.state.users,
            emailFilter: this.state.emailFilter,
            nameFilter: this.state.nameFilter,
            modalOpen: true,
            modalContents: modalContents
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
            console.log('sending request');
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

        if (this.state.querying) return null;

        const userList = this.state.users
            .filter((user: AllUserInfo) => EXEC_EMAILS.indexOf(user.email) === -1)
            .filter((user: AllUserInfo) =>
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
                    <p>
                        <a style={{paddingLeft: '1%'}} href="javascript:void(0)" onClick={_ => this.displayInfo.bind(this)(user)}>Manage details</a>
                        /
                        <a href="javascript:void(0)">Disable</a>
                    </p>
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
                    <hr/>
                </div>
                <div style={Object.assign({}, mainBoxStyle, { width: '30%', display: 'inline-block', height: '100%', overflow: 'scroll', verticalAlign: 'top' })}>
                    {userList.length > 0 ? userList : 'No matches'}
                </div>
                <ReactModal isOpen={this.state.modalOpen} contentLabel="DJ Details">
                    <button onClick={_ => this.updateState('modalOpen', false)}>Close</button>
                    {this.state.modalContents}
                </ReactModal>
            </div>
        );
    }
}
