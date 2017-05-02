import * as React from "react";
export interface ContactProps { compiler: string; framework: string; }

export class Contact extends React.Component<ContactProps, undefined> {
    render() {
        return <h1>Contact Us</h1>;
    }
}

