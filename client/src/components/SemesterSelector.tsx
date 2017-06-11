import * as React from "react";
import Component from "./Component";
import { Semester, SemesterResult, getThisSemester, getSemesterOffset } from "../ts/semester";
import WMFOStyles from "../ts/styles";

interface SemesterSelectorProps {
    onSemesterChange: (newSemester: SemesterResult) => void;
    semesterInit?: SemesterResult;
}

interface SemesterSelectorState {
    semesterManaging: SemesterResult;
    goToSemester: Semester;
    goToYear: number;
}

export class SemesterSelector extends Component<SemesterSelectorProps, SemesterSelectorState> {
    constructor(props: SemesterSelectorProps) {
        super(props);
        this.state = {
            semesterManaging: this.props.semesterInit || getThisSemester(),
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
        this.props.onSemesterChange(prevSemesterResult);
    }

    private async nextSemester(e: any) {
        e.preventDefault();
        const nextSemesterResult = getSemesterOffset(this.state.semesterManaging, 1);
        await this.updateStateAsync("semesterManaging", nextSemesterResult);
        this.props.onSemesterChange(nextSemesterResult);
    }

    private async handleClick() {
        await this.updateStateAsync("semesterManaging", { semester: this.state.goToSemester, year: parseInt(this.state.goToYear as any) });
        this.props.onSemesterChange(this.state.semesterManaging);
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
        return <div style={WMFOStyles.BOX_STYLE}>
            <p>
                <a href="javascript:void(0)" style={{float: "left", paddingLeft: "5%"}} onClick={this.prevSemester.bind(this)}>Prev Semester</a>
                Managing {`${this.state.semesterManaging.semester} ${this.state.semesterManaging.year}`}
                <a href="javascript:void(0)" style={{float: "right", paddingRight: "5%"}} onClick={this.nextSemester.bind(this)}>Next Semester</a>
            </p>
            <p>Go to:
                <select style={navigatorStyle} value={this.state.goToSemester} onChange={(e: any) => this.updateStateAsync("goToSemester", e.target.value)}>
                    <option>SPRING</option>
                    <option>SUMMER</option>
                    <option>FALL</option>
                </select>
                <select style={navigatorStyle} value={this.state.goToYear} onChange={(e: any) => this.updateStateAsync("goToYear", e.target.value)}>
                    {yearOptions}
                </select>
                <button onClick={this.handleClick.bind(this)} style={buttonStyle}>
                    Go
                </button>
            </p>
            {this.props.children}
        </div>;
    }
}
