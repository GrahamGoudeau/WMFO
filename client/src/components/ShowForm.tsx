import * as React from "react";
import { FormComponent } from "./Form";
import Component from "./Component";
import WMFOStyles from "../ts/styles";
import WMFORequest from "../ts/request";

type Semester = 'FALL' | 'SPRING' | 'SUMMER';

interface SemesterResult {
    semester: Semester;
    year: number;
}

interface CohostResult {
    email: string;
    id: number;
}

interface AddCohostProps {
    onSuccess: (newCohost: CohostResult) => void;
    onError: () => void;
}

interface AddCohostState {
    email: string;
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
            alert(`Oops, looks like we couldn't add ${this.state.email} right now- make sure you've spelled it right and that you've used the right email!`);
        }
    }

    render() {
        const inputStyle = Object.assign({}, WMFOStyles.TEXT_INPUT_STYLE, {
            marginTop: 0,
            margin: "0 0 0 0",
            display: "inline-block",
        });
        return <div>
            <input value={this.state.email} type="email" style={inputStyle} onChange={(e: any) => this.updateStateAsync("email", e.target.value)}/>
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
        };
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
                    {cohost.email} <a href="javascript:void(0)" onClick={_ => this.updateStateAsync("cohosts", this.state.cohosts.filter(host => host.email !== cohost.email))}>Remove</a>
                </li>
            );
        });

        return <form style={Object.assign({}, WMFOStyles.FORM_STYLE, { marginTop: "3%", padding: "1%", })}>
            <h3>Submit Show Request</h3>
            <hr/>
            <p>Show Name:</p>
            <input type="text" value={this.state.showName} id="showName" onChange={this.handleChange.bind(this)} style={inputStyle}/>

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
                <p>Your cohosts:</p>
                <ul>
                    {cohostList}
                </ul>
                <AddCohost
                    onSuccess={newHost => {
                        this.state.cohosts.push(newHost);
                        this.updateStateAsync("cohosts", this.state.cohosts);
                    }}
                    onError={() => console.log('err')}/>
            </div>
        </form>;
    }
};
