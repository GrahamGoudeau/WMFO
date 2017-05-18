import * as React from "react";
import Component from "./Component";

export interface MessageProps {
    showCondition: boolean;
    message: string;
    style: any
};

interface MessageState {
};

export class Message extends Component<MessageProps, MessageState> {
    constructor(props: MessageProps) {
        super(props);
        this.state = {
        };
    }

    render() {
        if (!this.props.showCondition) return null;
        return <p style={this.props.style}>{this.props.message}</p>;
    }
}
