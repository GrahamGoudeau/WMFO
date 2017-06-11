import * as React from "react";
import Maybe from "../ts/maybe";
import Component from "./Component";
import { FormComponent, ErrorState } from "./Form";
import WMFORequest from "../ts/request";
import { browserHistory } from "react-router";
import WMFOStyles from "../ts/styles";
import { Semester, SemesterResult, getThisSemester, getSemesterOffset } from "../ts/semester";
import { dateToHumanReadable } from "../ts/onClickUtils";
import * as ReactModal from "react-modal";
import { SemesterSelector } from "./SemesterSelector";

const TABLE_STYLE = Object.assign({}, WMFOStyles.TABLE_STYLE, {
    marginTop: "3%",
    marginBottom: "1%",
});

export interface ShowRequest {
    id: number;
    dateCreated: Date;
    showName: string;
    dayArr: string[];
    hoursArr: number[];
    doesAlternate: boolean;
    semester: Semester;
    year: number;
    hostIds: number[];
    hostEmails: string[];
}

interface ShowRequestsState {
    requests: ShowRequest[];
    querying: boolean;
    modalOpen: boolean;
    modalContents: JSX.Element;
    submitDay: string;
    submitTime: number;
}

interface ShowRequestsProps {
    semesterManaging: SemesterResult;
    onAddShow: (request: ShowRequest, showId: number, chosenDay: string, chosenTime: number) => void;
}

class ShowRequests extends Component<ShowRequestsProps, ShowRequestsState> {
    constructor(props: ShowRequestsProps) {
        super(props);
        this.state = {
            requests: [],
            querying: true,
            modalOpen: false,
            modalContents: null,
            submitDay: null,
            submitTime: null,
        };
    }

    async componentWillReceiveProps(nextProps: ShowRequestsProps) {
        if (nextProps.semesterManaging.semester !== this.props.semesterManaging.semester || nextProps.semesterManaging.year !== this.props.semesterManaging.year) {
            await this.populateResults();
        }
    }

    async populateResults() {
        await this.updateStateAsync("querying", true);
        try {
            const response = await WMFORequest.getInstance().POST("/api/exec/getShowRequestsBySemester", {
                semester: this.props.semesterManaging.semester,
                year: this.props.semesterManaging.year,
            });
            await this.updateStateAsync("requests", response.data.requests);
        } catch (e) {
            console.log('e', e);
        }
        await this.updateStateAsync("querying", false);
    }

    async componentDidMount() {
        await this.populateResults();
    }

    private async handleProcess(request: ShowRequest) {
        await this.displayInfo(request);
    }

    private async handleDelete(id: number, hostEmails: string[]) {
        try {
            await WMFORequest.getInstance().POST("/api/exec/deleteShowRequest", {
                id: id
            });
            await this.updateState("requests", this.state.requests.filter(req => req.id !== id));
            alert(`Deleted a show request from ${hostEmails.join(", ")}`);
        } catch (e) {
            console.log('exc', e);
            alert("Could not delete show request! Try again.");
        }
    }

    private async displayInfo(request: ShowRequest) {
        await this.updateStateAsync("submitDay", request.dayArr[0]);
        await this.updateStateAsync("submitTime", request.hoursArr[0]);
        const timeLookup: { [timeString: string]: { day: string; hour: number } } = {};
        const timeStrings = request.dayArr.map((day: string, i: number) => {
            const hour = request.hoursArr[i];
            const hourToUse = hour === 0 ? 12 : (hour % 12);
            const str = `${day} ${hourToUse}:00 ${hour > 12 ? "PM" : "AM"}`;
            timeLookup[str] = { day: day, hour: hour };
            return str;
        });
        const requestedTimes = timeStrings.map(timeString => {
            return <li>{timeString}</li>;
        });
        const submitTime = new Date(request.dateCreated);
        const submitHtml = `${dateToHumanReadable(submitTime)} ${submitTime.getHours() > 12 ? "PM" : "AM"}`;
        const fieldStyle = {
            marginBottom: "2%",
        };
        const selector = <select onChange={async (e: any) => {
                const value = e.target.value;
                await this.updateStateAsync("submitDay", timeLookup[value].day);
                await this.updateStateAsync("submitTime", timeLookup[value].hour);
        }}>
            {timeStrings.map(timeString => {
                return <option>{timeString}</option>
            })}
        </select>
        const modalContents = (
            <div style={{padding: "2%"}}>
                <h2>Request Content:</h2>
                <p style={fieldStyle}>Show Name: {request.showName}</p>
                <p style={fieldStyle}>Request Submitted: {submitHtml}</p>
                <p>Requested Times (in order of preference):</p>
                <ol style={fieldStyle}>
                    {requestedTimes}
                </ol>
                <p style={fieldStyle}>Wants to Alternate Weeks: {request.doesAlternate ? "Yes" : "No"}</p>
                <p style={fieldStyle}>Host Emails: {request.hostEmails.join(", ")}</p>
                <hr/>
                <br/>
                <h2>Finalize Request</h2>
                <p>If there is a problem with this request, delete it and have the hosts submit a new request.</p>
                <p>Otherwise, select a day/time for the show to air and submit.</p>
                {selector}
                <button onClick={e => this.addShow(request, this.state.submitDay, this.state.submitTime)}>Add Show to Schedule</button>
            </div>
        );
        await this.updateStateAsync("modalContents", modalContents);
        await this.updateStateAsync("modalOpen", true);
    }

    private async addShow(request: ShowRequest, submitDay: string, submitTime: number): Promise<void> {
        try {
            const response = await WMFORequest.getInstance().POST("/api/exec/addShowToSchedule", {
                showName: request.showName,
                dayOfWeek: submitDay,
                doesAlternate: request.doesAlternate,
                hour: submitTime,
                semester: request.semester,
                year: request.year,
                communityMemberEmails: request.hostEmails,
                communityMemberIds: request.hostIds,
                requestId: request.id,
            });
            const showId: number = response.data.showId;
            alert(`Successfully added ${request.showName} to the schedule for ${request.semester} ${request.year}`);
            this.props.onAddShow(request, showId, submitDay, submitTime);
            await this.updateStateAsync("requests", this.state.requests.filter(otherReq => otherReq.id !== request.id));
            await this.updateStateAsync("modalOpen", false);
            await this.updateStateAsync("modalContents", null);
        } catch (e) {
            alert("Something went wrong- try again");
            console.log(e);
        }
    }

    render() {
        if (this.state.querying) {
            return <div style={WMFOStyles.BOX_STYLE}>Loading...</div>
        }
        if (this.state.requests.length === 0) {
            return <div style={WMFOStyles.BOX_STYLE}>No show requests to be reviewed!</div>
        }
        const contents = this.state.requests.map(request => {
            const dateObj = new Date(request.dateCreated);
            return (<tr>
                <td>{request.showName}</td>
                <td>{`${dateToHumanReadable(dateObj)} ${new Date(dateObj).getHours() > 12 ? "PM" : "AM"}`}</td>
                <td>{request.hostEmails.join(", ")}</td>
                <td><a href="javascript:void(0)" onClick={e => this.handleProcess(request)}>Process Request</a></td>
                <td><a href="javascript:void(0)" onClick={e => this.handleDelete(request.id, request.hostEmails)}>Delete</a></td>
            </tr>);
        });
        return (<table style={TABLE_STYLE}>
            <h3>Pending Requests</h3>
            <hr/>
            <tr>
                <th>Show Name</th>
                <th>Date/Time Submitted</th>
                <th>Host Emails</th>
                <th>Add to Schedule?</th>
                <th>Delete Request?</th>
            </tr>
            {contents}
            <ReactModal isOpen={this.state.modalOpen}>
                <button onClick={_ => this.updateState("modalOpen", false)} style={{padding: "0.5%"}}>Close</button>
                <div style={{ marginTop: "2%", border: "solid", borderWidth: "1px" }}>
                    {this.state.modalContents}
                </div>
            </ReactModal>
        </table>);
    }
}

type AddShowListenerFunc = (request: ShowRequest, newShowId: number, chosenDay: string, chosenTime: number) => void;
class AddShowListener {
    private listeners: AddShowListenerFunc[] = [];
    private static INSTANCE: AddShowListener = null;

    private constructor() {
    }
    public static getInstance(): AddShowListener {
        if (AddShowListener.INSTANCE == null) {
            AddShowListener.INSTANCE = new AddShowListener();
        }
        return AddShowListener.INSTANCE;
    }

    public addListener(f: AddShowListenerFunc): void {
        this.listeners.push(f);
    }

    public showRequestApproved(request: ShowRequest, newShowId: number, chosenDay: string, chosenTime: number): void {
        this.listeners.forEach(f => f(request, newShowId, chosenDay, chosenTime));
    }
}


export interface Show {
    id: number;
    showName: string;
    dayOfWeek: string;
    doesAlternate: boolean;
    hour: number;
    semester: Semester;
    year: number;
    communityMemberEmails: string[];
    communityMemberIds: number[];
}

interface ScheduleState {
    querying: boolean;
    shows: Show[];
}

interface ScheduleProps {
    semesterManaging: SemesterResult;
}

class Schedule extends Component<ScheduleProps, ScheduleState> {
    private static IS_LISTENING: boolean = false;
    constructor(props: ScheduleProps) {
        super(props);
        this.state = {
            querying: true,
            shows: [],
        };
    }

    async componentWillReceiveProps(nextProps: ScheduleProps) {
        if (nextProps.semesterManaging.semester !== this.props.semesterManaging.semester || nextProps.semesterManaging.year !== this.props.semesterManaging.year) {
            await this.populateResults();
        }
    }

    async componentDidMount() {
        const self = this;
        if (!Schedule.IS_LISTENING) {
            AddShowListener.getInstance().addListener((request, id, chosenDay, chosenTime) => {
                const newShow: Show = Object.assign({}, request, {
                    id: id,
                    dayOfWeek: chosenDay,
                    hour: chosenTime,
                    communityMemberEmails: request.hostEmails,
                    communityMemberIds: request.hostIds,
                });
                self.setState({
                    querying: false,
                    shows: self.state.shows.concat([newShow]),
                });
            });
            Schedule.IS_LISTENING = true;
        }
        await this.populateResults();
    }

    private async handleDelete(showId: number, showName: string, hostEmails: string[]) {
        if (!confirm(`Are you sure you want to delete ${showName}?`)) {
            return;
        }

        try {
            await WMFORequest.getInstance().POST("/api/exec/deleteShow", {
                id: showId
            });
            await this.updateStateAsync("shows", this.state.shows.filter(show => show.id !== showId));
            alert(`Deleted show ${showName} hosted by ${hostEmails.join(", ")}`);
        } catch (e) {
            console.log("exc", e);
            alert("Could not delete show! Try again.");
        }
    }

    async populateResults() {
        await this.updateStateAsync("querying", true);
        try {
            const response = await WMFORequest.getInstance().POST("/api/exec/getScheduleBySemester", this.props.semesterManaging);
            await this.updateStateAsync("shows", response.data.schedule);
        } catch (e) {
            console.log("exception:", e);
        }
        await this.updateStateAsync("querying", false);
    }

    render() {
        if (this.state.querying) {
            return <div style={WMFOStyles.BOX_STYLE}>Loading...</div>
        }
        if (this.state.shows.length === 0) {
            return <div style={WMFOStyles.BOX_STYLE}>No shows scheduled yet!</div>
        }
        const contents = this.state.shows.map((show: Show) => {
            const hour = show.hour === 0 ? 12 : (show.hour % 12);
            return (<tr>
                <td>{show.showName}</td>
                <td>{show.communityMemberEmails.join(", ")}</td>
                <td>{`${show.dayOfWeek}, ${hour}:00 ${show.hour > 12 ? "PM" : "AM"}`}</td>
                <td>{show.doesAlternate ? "Yes" : "No"}</td>
                <td><a href="javascript:void(0)" onClick={e => this.handleDelete(show.id, show.showName, show.communityMemberEmails)}>Delete</a></td>
            </tr>);
        });

        return <table style={TABLE_STYLE}>
            <h3>Schedule</h3>
            <hr/>
            <tr>
                <th>Show Name</th>
                <th>Host Emails</th>
                <th>Show Time</th>
                <th>Alternating weeks?</th>
                <th>Delete From Schedule?</th>
            </tr>
            {contents}
        </table>;
    }
}


interface ManageScheduleState {
    semesterManaging: SemesterResult;
    goToSemester: Semester;
    goToYear: number;
}

export class ManageSchedule extends Component<{}, ManageScheduleState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            semesterManaging: getThisSemester(),
            goToSemester: getThisSemester().semester,
            goToYear: getThisSemester().year,
        };
    }

    private async prevSemester(e: any) {
        e.preventDefault();
        const prevSemesterResult = getSemesterOffset(this.state.semesterManaging, -1);
        if (prevSemesterResult.year < 2017) {
            alert("No show history on this new DJ portal prior to 2017.");
            return;
        }
        await this.updateStateAsync("semesterManaging", prevSemesterResult);
    }

    private async nextSemester(e: any) {
        e.preventDefault();
        const nextSemesterResult = getSemesterOffset(this.state.semesterManaging, 1);
        await this.updateStateAsync("semesterManaging", nextSemesterResult);
    }

    render() {
        const navigatorStyle = {
            margin: "0 auto",
            display: "block",
        };
        const buttonStyle = Object.assign({}, navigatorStyle, {
            paddingLeft: "1%",
            paddingRight: "1%",
        });
        const yearOptions = [];
        const nextYear: number = getSemesterOffset(getThisSemester(), 1).year;
        for (let i = 2017; i < nextYear + 2; i++) {
            yearOptions.push(<option>{i}</option>);
        }
        return (
            <div>
                <SemesterSelector onSemesterChange={(newSemester: SemesterResult) => this.updateState("semesterManaging", newSemester)}/>
                <Schedule semesterManaging={this.state.semesterManaging}/>
                <ShowRequests onAddShow={AddShowListener.getInstance().showRequestApproved.bind(AddShowListener.getInstance())} semesterManaging={this.state.semesterManaging}/>
            </div>
        );
    }
}
