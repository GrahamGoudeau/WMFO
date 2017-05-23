import * as React from "react";
import { Link, browserHistory } from "react-router";
import Maybe from "../ts/maybe";
import { EXEC_EMAILS, EXEC_BOARD_PERMISSIONS, PermissionLevel, AuthState, CommunityMemberRecord } from "../ts/authState";
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
}

interface ProfileViewProps {
    isExecBoardManaging: boolean; // allows editing of permissions
    profileData: CommunityMemberRecord;
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
        const shouldShowControl = !this.props.isExecBoardManaging && EXEC_EMAILS.indexOf(this.props.profileData.email) === -1;

        return (
            <div style={profileStyle}>
                <p>Email: {edit ? `${this.state.email} (contact the WebMaster to update your email)` : this.state.email}</p>
                <p>First Name: {edit ? <input id="editFirstName" type="text" value={this.state.editFirstName} onChange={this.handleChange.bind(this)}/> : this.props.profileData.firstName}</p>
                <p>Last Name: {edit ? <input id="editLastName" type="text" value={this.state.editLastName} onChange={this.handleChange.bind(this)}/> : this.props.profileData.lastName}</p>
                <p>Tufts ID: {tuftsId == null ? 'Not tracked yet' : tuftsId}</p>
                <p>User ID: {this.props.profileData.id}</p>
                <p>Permissions: {this.props.profileData.permissionLevels.reduce((acc: string, level: PermissionLevel) => {
                    return acc.length > 0 ? `${acc}, ${level}` : level
                }, '')}</p>

                {shouldShowControl && false ? control : null}
            </div>
        );
        // TODO: is updating user info a priority?
    }
}
