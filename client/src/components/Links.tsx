import * as React from "react";
export interface LinksProps { compiler: string; framework: string; }

export class Links extends React.Component<LinksProps, undefined> {
    render() {
        return <h1>Important Links</h1>;
    }
}

