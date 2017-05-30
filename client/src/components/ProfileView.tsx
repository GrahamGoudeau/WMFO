import * as React from "react";
import { Link, browserHistory } from "react-router";
import Maybe from "../ts/maybe";
import { PERMISSION_LEVEL_STRINGS, EXEC_EMAILS, EXEC_BOARD_PERMISSIONS, PermissionLevel, AuthState, CommunityMemberRecord } from "../ts/authState";
import Component from "./Component";
import { FormComponent, ErrorState } from "./Form";
import WMFORequest from "../ts/request";

interface ProfileViewState {
    editing: boolean;
    email: string;
    editEmail: string;
    firstName: string;
    editFirstName: string;
    lastName: string;
    editLastName: string;
    permissionLevels: PermissionLevel[];
}

interface ProfileViewProps {
    isExecBoardManaging: boolean; // allows editing of permissions
    profileData: CommunityMemberRecord;
    onUpdate: (newUser: CommunityMemberRecord) => void;
}

interface PermissionsEditState {
    editingPermissions: boolean;
    editedPermissionLevels: PermissionLevel[];
};

interface PermissionsEditProps {
    permissionLevels: PermissionLevel[];
    communityMemberId: number;
    onSave: (newPermissionLevels: PermissionLevel[]) => void;
}

class PermissionsEdit extends Component<PermissionsEditProps, PermissionsEditState> {
    private readonly CHANGE_PERMISSIONS_URL: string = '/api/exec/changePermissions';
    constructor(props: PermissionsEditProps) {
        super(props);
        this.state = {
            editingPermissions: false,
            editedPermissionLevels: this.props.permissionLevels.slice(),
        };
    }

    private async handleChange(event: any) {
        const level: PermissionLevel = event.target.value;
        const index: number = this.state.editedPermissionLevels.indexOf(level);
        const copy: PermissionLevel[] = this.state.editedPermissionLevels.slice();
        if (index !== -1) {
            copy.splice(index, 1);
            await this.updateStateAsync('editedPermissionLevels', copy);
        } else {
            copy.push(level);
            await this.updateStateAsync('editedPermissionLevels', copy);
        }
    }

    private async savePermissions(e: any) {
        e.preventDefault();
        try {
            const response = await WMFORequest.getInstance().POST(this.CHANGE_PERMISSIONS_URL, {
                communityMemberId: parseInt(this.props.communityMemberId as any),
                permissionLevels: this.state.editedPermissionLevels
            });
        } catch (e) {
            console.log('err', e);
            alert('Something went wrong! If this keeps happening, contact the WebMaster for help.');
            return;
        }
        this.props.onSave(this.state.editedPermissionLevels);
        await this.updateStateAsync('editingPermissions', false);
    }

    private async toggleEditing(e: any) {
        e.preventDefault();
        await this.updateStateAsync('editedPermissionLevels', this.props.permissionLevels.slice());
        await this.updateStateAsync('editingPermissions', !this.state.editingPermissions);
    }

    render() {
        if (this.state.editingPermissions) {
            return (
                <div style={{ border: 'solid', borderWidth: '0.5px' }}>
                    <h2>Edit Permissions</h2>
                    <div>
                        {PERMISSION_LEVEL_STRINGS.map((p: PermissionLevel) => {
                            return (
                                <label>
                                    <input style={{ marginRight: '3%' }}type="checkbox" value={p} checked={this.state.editedPermissionLevels.indexOf(p) !== -1} onClick={e => this.handleChange(e)}/>
                                    {p}
                                    <br/>
                                </label>
                            );
                        })}
                    </div>
                    <a href="javascript:void(0);" onClick={this.savePermissions.bind(this)}>Save</a>
                    /
                    <a href="javascript:void(0);" onClick={this.toggleEditing.bind(this)}>Cancel</a>
                </div>
            );
        } else {
            return (
                <div>
                    <a href="javascript:void(0);" onClick={this.toggleEditing.bind(this)}>(Edit)</a>
                </div>
            );
        }
    }
}

export class ProfileView extends FormComponent<ProfileViewProps, ProfileViewState> {
    private readonly UPDATE_PROFILE_URL: string = '/api/account/profile/update';
    constructor(props: ProfileViewProps) {
        super(props);
        this.state = {
            editing: false,
            email: this.props.profileData.email,
            editEmail: this.props.profileData.email,
            firstName: this.props.profileData.firstName,
            editFirstName: this.props.profileData.firstName,
            lastName: this.props.profileData.lastName,
            editLastName: this.props.profileData.lastName,
            permissionLevels: this.props.profileData.permissionLevels,
        };
    }

    private async cancelEdit(e: any) {
        e.preventDefault();
        await this.updateStateAsync('editEmail', this.state.email);
        await this.updateStateAsync('editFirstName', this.state.firstName);
        await this.updateStateAsync('editLastName', this.state.lastName);
        await this.updateStateAsync('editing', false);
    }

    // TODO: edit email
    private async saveEdit(e: any) {
        e.preventDefault();
        const updateObject: { email?: string, firstName?: string, lastName?: string, permissionLevels?: PermissionLevel[] } = {};
        if (this.state.editFirstName !== this.props.profileData.firstName) {
            updateObject.firstName = this.state.editFirstName;
        }
        if (this.state.editLastName !== this.props.profileData.lastName) {
            updateObject.lastName = this.state.editLastName;
        }
        if (Object.keys(updateObject).length > 0) {
            try {
                const response = WMFORequest.getInstance().POST(this.UPDATE_PROFILE_URL, updateObject);
            } catch (e) {
                console.log('err:', e);
            }
        } else {
            await this.cancelEdit(e);
        }
    }

    render() {
        const profileStyle = {
            color: '#333',
            backgroundColor: '#fefefe',
            borderRadius: '7px',
            padding: '1%',
            marginTop: '2%',
        };
        const tuftsId = this.props.profileData.tuftsId;

        const edit = this.state.editing;

        const control = edit ?
            <div>
                <input type="button" onClick={this.saveEdit.bind(this)} value="Save"/>
                <input type="button" onClick={this.cancelEdit.bind(this)} value="Cancel"/>
            </div> :
            <input type="button" onClick={e => this.updateState('editing', true)} value="Edit your information"/>;

        // only allow edit controls if not being managed by some other exec board member
        // and if the user is not an exec board member themselves
        // temporarily disabled
        const shouldShowControl = !this.props.isExecBoardManaging && EXEC_EMAILS.indexOf(this.props.profileData.email) === -1;

        const permissionsEdit = this.props.isExecBoardManaging ?
            <PermissionsEdit
                permissionLevels={this.state.permissionLevels}
                communityMemberId={this.props.profileData.id}
                onSave={(async (newPermissionLevels: PermissionLevel[]) => {
                    await this.updateStateAsync('permissionLevels', newPermissionLevels);
                    this.props.onUpdate(Object.assign({}, this.props.profileData, { permissionLevels: newPermissionLevels }));
                }).bind(this)}
            />
            :
            null

        // check if we should be displaying all the user info
        const allUserInfo: {
            numShowsHosted?: number;
            confirmedVolunteerHours?: number;
            pendingVolunteerHours?: number
        } = (this.props.profileData as any);

        const allUserDisplay = allUserInfo.numShowsHosted != null && allUserInfo.confirmedVolunteerHours != null && allUserInfo.pendingVolunteerHours != null ? (
            <div>
                <p>Shows hosted: {allUserInfo.numShowsHosted}</p>
                <p>Confirmed Volunteer Hours: {allUserInfo.confirmedVolunteerHours}</p>
                {allUserInfo.pendingVolunteerHours > 0 ? (<p>Pending Volunteer Hours: {allUserInfo.pendingVolunteerHours}</p>) : null}
            </div>
        ) : null;

        return (
            <div style={profileStyle}>
                <p>Email: {edit ? `${this.state.email} (contact the WebMaster to update your email)` : this.state.email}</p>
                <p>First Name: {edit ? <input id="editFirstName" type="text" value={this.state.editFirstName} onChange={this.handleChange.bind(this)}/> : this.props.profileData.firstName}</p>
                <p>Last Name: {edit ? <input id="editLastName" type="text" value={this.state.editLastName} onChange={this.handleChange.bind(this)}/> : this.props.profileData.lastName}</p>
                <p>Tufts ID: {tuftsId == null ? 'Not tracked yet' : tuftsId}</p>
                <p>User ID: {this.props.profileData.id}</p>
                <p>Permissions: {this.state.permissionLevels.reduce((acc: string, level: PermissionLevel) => {
                    return acc.length > 0 ? `${acc}, ${level}` : level
                }, '')} {permissionsEdit}</p>
                {allUserDisplay}

                {shouldShowControl && false ? control : null}
            </div>
        );
        // TODO: is updating user info a priority?
    }
}
