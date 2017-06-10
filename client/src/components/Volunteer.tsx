import * as React from "react";
import Maybe from "../ts/maybe";
import { PermissionLevel, AuthState, CommunityMemberRecord } from "../ts/authState";
import { dateToHumanReadable } from "../ts/onClickUtils";
import Component from "./Component";
import { FormComponent, ErrorState } from "./Form";
import WMFORequest from "../ts/request";
import { browserHistory } from "react-router";
import DatePicker from "react-datepicker";
import WMFOStyles from "../ts/styles";

interface LogHoursState {
    task: string;
    date: string;
    description: string;
    numHours: number;
    numMinutes: number;
    hasSubmitted: boolean;
    error: boolean;
    message: string;
}

class LogHours extends FormComponent<{}, LogHoursState> {
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

    private handleTextAreaUpdate(text: string) {
        this.updateState('description', text);
    }

    render() {
        return (
            <form style={WMFOStyles.FORM_STYLE} onSubmit={this.handleSubmit.bind(this)}>
                <p style={{textAlign: 'center'}}>Log Volunteer Hours</p>
                <label>Date of volunteer work:</label>
                <DatePicker value={this.state.date} onChange={this.handleDateUpdate.bind(this)}/>
                <br/>
                <label>Description of volunteer task</label>
                <br/>
                <textarea style={{display: 'block', height: '75px'}} id="description" value={this.state.description} onChange={e => this.handleTextAreaUpdate.bind(this)((e as any).target.value)}/>

                <br/>
                <label>Number of hours worked</label>
                <select value={this.state.numHours} id="numHours" onChange={e => this.handleNumHoursUpdate(e)}>
                    <option>0</option>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                </select>

                <br/>
                <label>Number of minutes</label>
                <select id="numMinutes" value={this.state.numMinutes} onChange={e => this.handleMinutesUpdate(e)}>
                    <option>0</option>
                    <option>15</option>
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

interface VolunteerHours {
    id: number;
    created: Date;
    volunteerDate: Date;
    numHours: number;
    description: string;
    confirmed: boolean;
    email: string;
}

// sort volunteer hours by most recent volunteer date
function volunteerDateComparator(vh1: VolunteerHours, vh2: VolunteerHours): number {
    const date1 = new Date(vh1.volunteerDate);
    const date2 = new Date(vh2.volunteerDate);
    if (date1 < date2) return 1;
    if (date2 < date1) return -1;
    return 0;
}

interface ReviewHoursState {
    querying: boolean;
    hours: VolunteerHours[];
}

class ReviewHours extends Component<{}, ReviewHoursState> {
    private readonly GET_HOURS_URL: string = '/api/dj/getVolunteerHours';
    constructor(props: any) {
        super(props);
        this.state = {
            querying: true,
            hours: [],
        };
    }

    async componentDidMount() {
        await AuthState.getInstance().updateState();
        if (this.state.querying) {
            try {
                const response = await WMFORequest.getInstance().GET(this.GET_HOURS_URL);
                await this.updateStateAsync('hours', response.data);
            } catch (e) {
                console.log('error:', e);
            }
            await this.updateStateAsync('querying', false);
        }
    }

    render() {
        if (this.state.querying) return null;
        const noticeStyle = {
            color: '#333',
            backgroundColor: '#fefefe',
            borderRadius: '7px',
            padding: '1%',
            marginTop: '2%',
            textAlign: 'center',
            overflow: 'scroll',
            width: '100%',
        };
        const rows = this.state.hours
            // sort by most recent volunteer date first
            .sort(volunteerDateComparator)

            // convert to HTML table rows
            .map((hours: VolunteerHours) =>
                (<tr>
                    <td>{dateToHumanReadable(new Date(hours.volunteerDate)).split(' ')[0]}</td>
                    <td>{hours.numHours}</td>
                    <td><div style={{overflow: 'scroll', width: '100%'}}>{hours.description}</div></td>
                    <td>{hours.confirmed ? 'Yes' : 'No'}</td>
                    <td>{dateToHumanReadable(new Date(hours.created)).split(' ')[0]}</td>
                </tr>));

        const noHoursInfo = (
            <p style={noticeStyle}>No logged hours.</p>
        );
        return this.state.hours.length === 0 ? noHoursInfo : (
            <div style={{width: '100%', overflow: 'scroll'}}>
                <table style={Object.assign({}, noticeStyle, {tableLayout: 'fixed'})}>
                    <h3>Reported Hours:</h3>
                    <hr/>
                    <tr>
                        <th>Date volunteered</th>
                        <th>Time spent volunteering (hours)</th>
                        <th>Description of volunteer task</th>
                        <th>Confirmed by exec board</th>
                        <th>Date logged by user</th>
                    </tr>
                    {rows}
                </table>
            </div>
        );
    }
}

interface VolunteerState {
    logHours: Maybe<boolean>;
};

export class DJVolunteer extends Component<{}, VolunteerState> {
    constructor(props: any) {
        super(props);
        this.state = {
            logHours: Maybe.nothing<boolean>()
        };
    }

    changeForm(logHours: boolean) {
        this.updateState('logHours', Maybe.just<boolean>(logHours));
    }

    render() {
        const options = (
            <ul className="navbar" style={{
                marginTop: '5%',
                marginBottom: '2%',
            }}>
                <li><a href="javascript:void(0);" onClick={(event) => this.changeForm.bind(this)(true)}>Report Additional Hours</a></li>
                <li><a href="javascript:void(0);" onClick={(event) => this.changeForm.bind(this)(false)}>Review Reported Hours</a></li>
            </ul>
        );
        const content = this.state.logHours.caseOf({
            nothing: () => null,
            just: (logHours) => logHours ? <LogHours/> : <ReviewHours/>
        });
        return (
            <div>
                {options}
                {content}
            </div>
        );
    }
}

interface ExecVolunteerReviewState {
    unconfirmedHours: VolunteerHours[];
    querying: boolean;
}

export class ExecVolunteerReview extends Component<{}, ExecVolunteerReviewState> {
    private readonly GET_HOURS_EXEC_URL: string = '/api/exec/getUnconfirmedHours';
    private readonly CONFIRM_HOURS_URL: string = '/api/exec/approveHours';
    private readonly DELETE_HOURS_URL: string = '/api/exec/deleteHours';

    constructor(props: {}) {
        super(props);
        this.state = {
            querying: true,
            unconfirmedHours: [],
        };
    }

    async componentDidMount() {
        await AuthState.getInstance().updateState();
        try {
            const response = await WMFORequest.getInstance().GET(this.GET_HOURS_EXEC_URL);
            await this.updateStateAsync('unconfirmedHours', response.data);
        } catch (e) {
            console.log('error:', e);
        }
        await this.updateStateAsync('querying', false);
    }

    private async resolveHours(id: number, toDelete: boolean) {
        const url: string = toDelete ? this.DELETE_HOURS_URL : this.CONFIRM_HOURS_URL;
        const hours: VolunteerHours = this.state.unconfirmedHours.find((hours: VolunteerHours) => hours.id === id);
        if (toDelete && !confirm(`Are you sure you want to delete ${hours.numHours} hours from ${hours.email}?`)) {
            return;
        }

        try {
            const response = await WMFORequest.getInstance().POST(url, {
                hoursId: id
            });

            await this.updateStateAsync('unconfirmedHours', this.state.unconfirmedHours.filter((hours: VolunteerHours) => hours.id !== id));
        } catch (e) {
            console.log('error resolving:', e);
            alert('Something went wrong while resolving these hours!  If the problem persists, contact the webmaster.');
        }
    }

    render() {
        if (this.state.querying) return null;
        const style = {
            color: '#333',
            backgroundColor: '#fefefe',
            borderRadius: '7px',
            padding: '1%',
            marginTop: '2%',
            textAlign: 'center',
            overflow: 'scroll',
            width: '100%',
        };
        if (this.state.unconfirmedHours.length === 0) {
            return <p style={style}>No pending hours.</p>
        }

        const rows = this.state.unconfirmedHours
            .sort(volunteerDateComparator)
            .map((hours: VolunteerHours) =>
                (<tr>
                    <td>{hours.email}</td>
                    <td>{dateToHumanReadable(new Date(hours.volunteerDate)).split(' ')[0]}</td>
                    <td>{dateToHumanReadable(new Date(hours.created)).split(' ')[0]}</td>
                    <td>{hours.numHours}</td>
                    <td><div style={{overflow: 'scroll', width: '100%'}}>{hours.description}</div></td>
                    <td>
                        <a href="javascript:void(0);" onClick={e => this.resolveHours(hours.id, false)}>Confirm</a>
                        /
                        <a href="javascript:void(0);" onClick={e => this.resolveHours(hours.id, true)}>Delete</a></td>
                </tr>));

        return (
            <div style={{width: '100%', overflow: 'scroll'}}>
                <table style={Object.assign({}, style, {tableLayout: 'fixed'})}>
                    <h3>Hours Pending Approval:</h3>
                    <hr/>
                    <tr>
                        <th>User email</th>
                        <th>Date volunteered</th>
                        <th>Date logged</th>
                        <th>Number of hours worked</th>
                        <th>Description of task</th>
                        <th>Confirm?</th>
                    </tr>
                    {rows}
                </table>
            </div>
        );
    }
}
