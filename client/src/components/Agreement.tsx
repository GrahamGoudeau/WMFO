import * as React from "react";
import Maybe from "../ts/maybe";
import Component from "./Component";
import WMFORequest from "../ts/request";
import WMFOStyles from "../ts/styles";
import { AuthState, CommunityMemberRecord } from "../ts/authState";
import { dateToHumanReadable } from "../ts/onClickUtils";

interface WMFOAgreement {
    agreementText: string;
    dateCreated: Date;
    id: number;
};

interface AgreementState {
    agreement: WMFOAgreement;
    querying: boolean;
    userHasAgreed: boolean;
}

export class Agreement extends Component<{}, AgreementState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            agreement: null,
            querying: true,
            userHasAgreed: false,
        };
    }

    async componentDidMount() {
        try {
            const response = await WMFORequest.getInstance().GET("/api/dj/getMostRecentAgreement");
            const agreement = Object.assign({}, response.data, {
                dateCreated: new Date(response.data.dateCreated),
            });
            await this.updateStateAsync("agreement", agreement);
        } catch (e) {
            console.log("exception:", e);
        }
        await this.updateStateAsync("querying", false);
    }

    private async handleClick() {
        try {
            const response = await WMFORequest.getInstance().POST("/api/dj/signAgreement", {
                agreementId: this.state.agreement.id,
            });
            await this.updateStateAsync("userHasAgreed", true);
        } catch (e) {
            alert("Something went wrong while signing the agreement.");
        }
    }

    render() {
        if (this.state.agreement == null) {
            return <div style={WMFOStyles.BOX_STYLE}>
                An error occurred :( Try again later!
            </div>;
        }
        const user = AuthState.getInstance().getState().valueOr<Error>(new Error("not signed in- shouldn't see this")) as CommunityMemberRecord;
        let contents = null;
        const buttonStyle = Object.assign({}, WMFOStyles.BUTTON_STYLE, {
            marginTop: "3%",
            padding: "1% 2% 1% 2%",
        });

        if (this.state.querying) {
            contents = null;
        }
        if (this.state.userHasAgreed || this.state.agreement.id === user.lastAgreementSigned) {
            contents = <p>Looks like you've signed the most recent DJ agreement.  You're all up to date, nothing to do here!</p>;
        } else {
            contents = <div>
                <p>This agreement must be signed before you can request a new show</p>
                <br/>
                <hr/>
                <p style={{ fontWeight: "bold", textAlign: "left" }}>{this.state.agreement.agreementText}</p>
                <p>
                    (this agreement last updated {dateToHumanReadable(this.state.agreement.dateCreated).split(" ")[0]})
                </p>
                <hr/>
                <p style={{ marginTop: "5%", textAlign: "left"}}>
                    {user.firstName} {user.lastName} - I have read and understood the above DJ agreement, and will abide by its terms.
                    <button style={buttonStyle} onClick={_ => this.handleClick()}>Agree and Submit</button>
                </p>
            </div>;
        }

        return <div style={WMFOStyles.BOX_STYLE}>
            <h1>WMFO DJ Agreement</h1>
            {contents}
        </div>
    }
}

/*
interface ManageAgreementState {
    oldAgreement: Agreement;
    querying: boolean;
}

export class ManageAgreement extends Component<{}, ManageAgreementState>
*/
