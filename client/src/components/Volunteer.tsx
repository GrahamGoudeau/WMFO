import * as React from "react";
import Maybe from "../ts/maybe";
import { PermissionLevel, AuthState, CommunityMemberRecord } from "../ts/authState";
import Component from "./Component";
import { FormComponent, ErrorState } from "./Form";
import WMFORequest from "../ts/request";
import { browserHistory } from "react-router";
import DatePicker from "react-datepicker";


interface VolunteerState {
    task: string;
    date: string;
    description: string;
    numHours: number;
    numMinutes: number;
    hasSubmitted: boolean;
    error: boolean;
    message: string;
}

export default class Volunteer extends FormComponent<{}, VolunteerState> {
    private readonly SUBMIT_URL: string = '/api/dj/log';

    constructor(props: any) {
        super(props);
        this.state = {
            task: '',
            date: '',
            description: '',
            numHours: 0,
            numMinutes: 0,
            hasSubmitted: false,
            error: false,
            message: '',
        };
    }

    async componentDidMount() {
    }

    private handleDateUpdate(moment: any) {
        this.updateState('date', moment.format('MM/DD/YYYY'));
    }

    private handleNumHoursUpdate(event: any) {
        this.updateState('numHours', parseInt(event.target.value));
    }

    private handleMinutesUpdate(event: any) {
        this.updateState('numMinutes', parseInt(event.target.value));
    }

    async handleSubmit(e: any) {
        e.preventDefault();
        try {
            const response = await WMFORequest.getInstance().POST(this.SUBMIT_URL, {
                volunteerDate: this.state.date,
                numHours: this.state.numHours + (this.state.numMinutes / 60),
                description: this.state.description,
            });

            await this.updateStateAsync('error', false);
            await this.updateStateAsync('message', `Submitted ${this.state.numHours + this.state.numMinutes / 60} volunteer hours.`);
            this.setState({
                task: '',
                date: '',
                description: '',
                numHours: 0,
                numMinutes: 0,
                hasSubmitted: true,
                error: false,
                message: this.state.message,
            });
        } catch (e) {
            console.log('error submitting', e);
            await this.updateState('error', true);
            await this.updateState('message', 'Error submitting; if this continues to happen, contact the webmaster for help.');
        }
        this.updateState('hasSubmitted', true);
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit.bind(this)}>
                <label>Date of volunteer work:</label>
                <DatePicker value={this.state.date} onChange={this.handleDateUpdate.bind(this)}/>
                <br/>
                <label>Description of volunteer task</label>
                <textarea id="description" value={this.state.description} onChange={this.handleChange.bind(this)}/>

                <br/>
                <label>Number of hours worked</label>
                <select id="numHours" onChange={e => this.handleNumHoursUpdate(e)}>
                    <option>0</option>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                </select>

                <br/>
                <label>Number of minutes</label>
                <select id="numMinutes" onChange={e => this.handleMinutesUpdate(e)}>
                    <option>0</option>
                    <option>1</option>
                    <option>30</option>
                    <option>45</option>
                </select>

                <br/>
                <input type="submit" value="Submit"/>
                <br/>
                <p style={{
                    display: this.state.hasSubmitted ? 'block' : 'none'
                }}>{this.state.message}</p>
            </form>
        );
    }
}
