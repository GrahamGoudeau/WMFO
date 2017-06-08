import * as React from "react";
import { ErrorState, FormComponent } from "./Form";
import Component from "./Component";
import WMFOStyles from "../ts/styles";
import WMFORequest from "../ts/request";
import { Message } from "./Message";

type Semester = 'FALL' | 'SPRING' | 'SUMMER';

interface SemesterResult {
    semester: Semester;
    year: number;
}

interface CohostResult {
    email: string;
    id: number;
}

interface AddDayTimesProps {
    onSuccess: (newDayTime: DayTimeResult) => void;
    onError: (e: any) => void;
}

interface AddDayTimesState {
    hour: number,
    day: string,
}

class AddDayTimes extends Component<AddDayTimesProps, AddDayTimesState> {
    constructor(props: AddDayTimesProps) {
        super(props);
        this.state = {
            hour: 0,
            day: "SUNDAY",
        };
    }

    render() {
        const inputStyle = Object.assign({}, WMFOStyles.TEXT_INPUT_STYLE, {
            marginTop: 0,
            margin: "0 0 0 0",
            display: "inline-block",
            width: "5%",
        });
        return <div>
            <select style={{display: "inline-block"}} value={this.state.hour} onChange={(e: any) => {
                this.updateStateAsync("hour", parseInt(e.target.value));
            }}>
                <option value="0">Midnight</option>
                <option value="1">1:00 AM</option>
                <option value="2">2:00 AM</option>
                <option value="3">3:00 AM</option>
                <option value="4">4:00 AM</option>
                <option value="5">5:00 AM</option>
                <option value="6">6:00 AM</option>
                <option value="7">7:00 AM</option>
                <option value="8">8:00 AM</option>
                <option value="9">9:00 AM</option>
                <option value="10">10:00 AM</option>
                <option value="11">11:00 AM</option>
                <option value="12">Noon</option>
                <option value="13">1:00 PM</option>
                <option value="14">2:00 PM</option>
                <option value="15">3:00 PM</option>
                <option value="16">4:00 PM</option>
                <option value="17">5:00 PM</option>
                <option value="18">6:00 PM</option>
                <option value="19">7:00 PM</option>
                <option value="20">8:00 PM</option>
                <option value="21">9:00 PM</option>
                <option value="22">10:00 PM</option>
                <option value="23">11:00 PM</option>
            </select>
            <select style={{display: "inline-block"}} value={this.state.day} onChange={(e: any) => { console.log(e.target.value); this.updateStateAsync("day", e.target.value)}}>
                <option>SUNDAY</option>
                <option>MONDAY</option>
                <option>TUESDAY</option>
                <option>WEDNESDAY</option>
                <option>THURSDAY</option>
                <option>FRIDAY</option>
                <option>SATURDAY</option>
            </select>
            <a href="javascript:void(0)" style={{display: "inline-block"}} onClick={(e: any) => this.props.onSuccess({ day: this.state.day, hour: this.state.hour })}>Save</a>
        </div>;
    }
}

interface AddCohostProps {
    onSuccess: (newCohost: CohostResult) => void;
    onError: (e: any) => void;
}

interface AddCohostState {
    email: string;
}

interface DayTimeResult {
    hour: number;
    day: string;
}

class AddCohost extends Component<AddCohostProps, AddCohostState> {
    constructor(props: AddCohostProps) {
        super(props);
        this.state = {
            email: "",
        };
    }

    private async handleAdd(e: any) {
        e.preventDefault();
        const email = this.state.email.trim();
        try {
            const response = await WMFORequest.getInstance().POST("/api/dj/getIdFromEmail", {
                email: email
            });
            this.setState({
                email: "",
            });
            this.props.onSuccess({ email: email, id: response.data.id });
        } catch (e) {
            this.props.onError(e);
        }
    }

    render() {
        const inputStyle = Object.assign({}, WMFOStyles.TEXT_INPUT_STYLE, {
            marginTop: 0,
            margin: "0 0 0 0",
            display: "inline-block",
        });
        return <div>
            <input placeholder="new cohost email" value={this.state.email} type="email" style={inputStyle} onChange={(e: any) => this.updateStateAsync("email", e.target.value)}/>
            <a href="javascript:void(0)" onClick={this.handleAdd.bind(this)}>Add</a>
        </div>;
    }
}

interface ShowFormState {
    showAirsThisSemester: boolean;
    doesAlternate: boolean;
    thisSemester: SemesterResult;
    nextSemester: SemesterResult;
    showName: string;
    cohosts: CohostResult[];
    times: DayTimeResult[];
    message: string;
    showNameError: boolean;
    timesError: boolean;
    requestSent: boolean;
}

export class ShowForm extends FormComponent<{}, ShowFormState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            showAirsThisSemester: true,
            thisSemester: this.getSemester(false),
            nextSemester: this.getSemester(true),
            doesAlternate: false,
            showName: "",
            cohosts: [],
            times: [],
            message: "",
            showNameError: false,
            timesError: false,
            requestSent: false,
        };
    }

    private errorStates: ErrorState<ShowFormState>[] = [{
        field: "showNameError",
        condition: (state: ShowFormState) => state.showName.length === 0
    }, {
        field: "timesError",
        condition: (state: ShowFormState) => state.times.length === 0
    }];

    async handleSubmit(e: any) {
        e.preventDefault();
        await this.updateStateAsync("requestSent", false);
        if (await this.errorCheck(this.state, this.errorStates)) {
            return;
        }

        await this.updateStateAsync("requestSent", true);
        if (!confirm(`Ready to submit a request for your show "${this.state.showName}"?`)) {
            return;
        }
        try {
            const semester = this.state.showAirsThisSemester ? this.state.thisSemester : this.state.nextSemester;
            const data = {
                otherRequestOwners: this.state.cohosts.map(cohost => cohost.id) || [],
                showName: this.state.showName,
                dayArr: this.state.times.map(time => time.day),
                hoursArr: this.state.times.map(time => time.hour),
                doesAlternate: this.state.doesAlternate,
                semester: semester.semester,
                year: semester.year,
            };
            const response = await WMFORequest.getInstance().POST("/api/dj/submitShowRequest", data);
            this.updateStateAsync("message", "Your request has been submitted and will be reviewed by the WMFO exec board. Thanks!");

            this.setState({
                showAirsThisSemester: true,
                thisSemester: this.getSemester(false),
                nextSemester: this.getSemester(true),
                doesAlternate: false,
                showName: "",
                cohosts: [],
                times: [],
                message: this.state.message,
                showNameError: false,
                timesError: false,
                requestSent: this.state.requestSent,
            });
        } catch (e) {
            const error = e.responseJSON;
            if (error.error && error.error.message && error.error.message === "NOT_SIGNED_AGREEMENT") {
                this.updateStateAsync("message", "Oops! Looks like one or more hosts of this show have not signed their DJ agreements. Make sure to do that first!");
            } else {
                console.log("exc", e);
                this.updateStateAsync("message", "Looks like something went wrong. Try again later and let the WebMaster know if the problem continues.");
            }
        }
    }

    private getSemester(findNext: boolean): SemesterResult {
        const today = new Date();
        const springSemesterBegin = 0; // January is 0
        const summerSemesterBegin = 5;
        const fallSemesterBegin = 8;

        const thisMonth = today.getMonth();
        const thisYear = today.getFullYear();

        let semester: Semester;
        if (thisMonth < summerSemesterBegin) {
            semester = findNext ? "SUMMER" : "SPRING";
        } else if (thisMonth < fallSemesterBegin) {
            semester = findNext ? "FALL" : "SUMMER";
        } else {
            semester = findNext ? "SPRING" : "FALL";
        }

        return {
            semester: semester,
            year: thisYear
        };
    }

    render() {
        const inputStyle = Object.assign({}, WMFOStyles.TEXT_INPUT_STYLE, {
            marginTop: 0,
            margin: "0 0 0 0",
        });
        const checkboxStyle = {
            cursor: "pointer",
        };
        const questionStyle = {
            marginBottom: "3%",
        };
        const listItemStyle = {
            listStyleType: "none",
        };
        const cohostList = this.state.cohosts.map((cohost: CohostResult) => {
            return (
                <li style={listItemStyle}>
                    {cohost.email}
                    <a href="javascript:void(0)" onClick={_ => this.updateStateAsync("cohosts", this.state.cohosts.filter(host => host.email !== cohost.email))}>Remove</a>
                </li>
            );
        });

        const dayTimeList = this.state.times.map((dayTime: DayTimeResult) => {
            return (
                <li style={listItemStyle}>
                    {`${dayTime.hour % 12 > 0 ? dayTime.hour % 12 : 12}:00 ${dayTime.hour >= 12 ? 'PM' : 'AM'}, ${dayTime.day}`}
                    <a href="javascript:void(0)" onClick={(e: any) => this.updateStateAsync("times", this.state.times.filter(time => time.hour !== dayTime.hour || time.day !== dayTime.day))}>Remove</a>
                </li>
            );
        });

        return <form style={Object.assign({}, WMFOStyles.FORM_STYLE, { marginTop: "3%", marginBottom: "3%", padding: "1%", })}>
            <h3>Submit Show Request</h3>
            <hr/>
            <p>Your show's name:</p>
            <input type="text" value={this.state.showName} id="showName" onChange={this.handleChange.bind(this)} placeholder="show name" style={inputStyle}/>
            <Message showCondition={this.state.showNameError} message="Must fill in show name" style={{color: "red"}}/>

            <div style={questionStyle}>
                <p>Your Show Airs In:</p>
                <p onClick={_ => this.updateStateAsync("showAirsThisSemester", true)}>
                    <input type="radio" checked={this.state.showAirsThisSemester} style={checkboxStyle}/> {`${this.state.thisSemester.semester} ${this.state.thisSemester.year}`}
                </p>

                <p onClick={_ => this.updateStateAsync("showAirsThisSemester", false)}>
                    <input type="radio" checked={!this.state.showAirsThisSemester} style={checkboxStyle}/> {`${this.state.nextSemester.semester} ${this.state.nextSemester.year}`}
                </p>
            </div>

            <div style={questionStyle}>
                <p>Your Show:</p>
                <p onClick={_ => this.updateStateAsync("doesAlternate", false)}>
                    <input type="radio" checked={!this.state.doesAlternate} style={checkboxStyle}/> does NOT alternate weeks
                </p>

                <p onClick={_ => this.updateStateAsync("doesAlternate", true)}>
                    <input type="radio" checked={this.state.doesAlternate} style={checkboxStyle}/> DOES alternate weeks
                </p>
            </div>

            <div style={questionStyle}>
                <p>Your cohosts' emails (leave blank if none):</p>
                <ul>
                    {cohostList}
                </ul>
                <AddCohost
                    onSuccess={newHost => {
                        this.state.cohosts.push(newHost);
                        this.setState(this.state);
                    }}
                    onError={(_: any) => alert(`Looks like we couldn't find that user. Make sure you're using the right email!`)}/>
            </div>

            <div style={questionStyle}>
                <p>Your preferred days/times: ({this.state.times.length} out of a max of 15)</p>
                <ul>
                    {dayTimeList}
                </ul>
                <AddDayTimes
                    onSuccess={newDayTime => {
                        if (this.state.times.length >= 15) {
                            alert("You've hit your limit for day/time preferences");
                            return;
                        }
                        this.state.times.push(newDayTime);
                        this.setState(this.state);
                    }}
                    onError={(e: any) => console.log('exc', e)}/>
                <Message showCondition={this.state.timesError} message="Must have at least one preferred time" style={{color: "red"}}/>
            </div>
            <Message showCondition={this.state.requestSent} message={this.state.message} style={{color: "red"}}/>
            <button style={WMFOStyles.BUTTON_STYLE} onClick={this.handleSubmit.bind(this)}>Submit Request</button>
        </form>;
    }
};
