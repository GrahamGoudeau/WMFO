import * as React from "react";
import Maybe from "../ts/maybe";
import { PermissionLevel, AuthState, CommunityMemberRecord } from "../ts/authState";
import Component from "./Component";
import WMFORequest from "../ts/request";
import { browserHistory } from "react-router";

interface PendingCommunityMember {
    email: string;
    code: string;
    permissionLevels: PermissionLevel[];
};

interface PendingMembersState {
    querying: boolean;
    error: boolean;
    pendingMembers: PendingCommunityMember[];
}

export default class PendingMembers extends Component<{}, PendingMembersState> {
    private readonly GET_MEMBERS_URL: string = '/api/exec/getUnconfirmedAccounts';
    private static ATTACHED_LISTENER: boolean = false;
    private readonly BASE_URL: string = window.location.host;

    constructor(props: any) {
        super(props);
        this.state = {
            querying: true,
            error: false,
            pendingMembers: []
        };
    }

    async componentDidMount() {
        await AuthState.getInstance().updateState();
        if (!PendingMembers.ATTACHED_LISTENER) {
            const self = this;
            AuthState.getInstance().addListener(async (s: Maybe<CommunityMemberRecord>) => {
                await this.updateState('querying', true);
                await this.updateState('error', false);
            });
            PendingMembers.ATTACHED_LISTENER = true;
        }
        if (this.state.querying) {
            try {
                const response = await WMFORequest.getInstance().GET(this.GET_MEMBERS_URL);
                await this.updateStateAsync('querying', false);
                await this.updateStateAsync('error', false);
                await this.updateStateAsync('pendingMembers', response.data);
            } catch (e) {
                console.log('error:', e);
                await this.updateStateAsync('querying', false);
                await this.updateStateAsync('error', true);
            }
        }
    }

    render() {
        if (this.state.querying || this.state.error) {
            return null;
        } else {
            const rowStyle = {
                marginTop: '10%',
                marginBottom: '10%'
            };
            const noticeStyle = {
                color: '#333',
                backgroundColor: '#fefefe',
                borderRadius: '7px',
                padding: '1%',
                marginTop: '2%',
                marginBottom: '1%',
                textAlign: 'center',
            };
            const userInfo = this.state.pendingMembers.map((member: PendingCommunityMember) => {
                const permissionString = member.permissionLevels.reduce((acc: string, p: PermissionLevel) => {
                    return acc.length > 0 ? `${acc}, ${p}` : p
                }, '');

                // TODO: deletion
                return (<tr style={rowStyle}>
                    <td>{member.email}</td>
                    <td>{permissionString}</td>
                    <td>{`${this.BASE_URL}/register/${member.code}`}</td>
                    <td><a href="javaScript:void(0);"></a></td>
                </tr>);
            });
            const noMembersInfo = (
                <p style={noticeStyle}>No pending members.</p>
            );
            return userInfo.length === 0 ? noMembersInfo : (
                <div>
                    <p style={noticeStyle}>A pending member must visit their unique URL to set their password and finalize their info.</p>

                    <table style={{
                        backgroundColor: '#fefefe',
                        borderRadius: '7px',
                        padding: '1%',
                        width: '100%',
                        textAlign: 'center',
                    }}>
                        <tr style={rowStyle}><th>Email</th><th>Permissions</th><th>Unique URL</th><th></th></tr>
                        {userInfo}
                    </table>
                </div>
            );
        }
    }
}

