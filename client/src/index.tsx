import * as React from "react";
import * as ReactDOM from "react-dom";
import { Router, Route, browserHistory, IndexRoute } from "react-router"
import {Link} from "react-router";
import { Home } from "./components/Home";
import { About } from "./components/About";
import { ShowForm } from "./components/ShowForm"
import { Volunteer } from "./components/Volunteer";
import { Contact } from "./components/Contact";
import { Links } from "./components/Links";
import { Unknown } from "./components/Unknown";
import { AddUsers } from "./components/AddUsers";
import { PermissionLevel, CommunityMemberRecord, AuthState, EXEC_BOARD_PERMISSIONS, DJ_PERMISSIONS } from "./ts/authState";
import WMFORequest from "./ts/request";
import Maybe from "./ts/maybe";

interface AppState {
    user: Maybe<CommunityMemberRecord>;
}

class App extends React.Component<{}, AppState> {
    constructor() {
        super();
        this.state = {
            user: Maybe.nothing<CommunityMemberRecord>()
        };
        AuthState.getInstance().addListener(m => {
            this.setState({
                user: m
            });
        });
    }

    componentDidMount() {
        // trigger an auth state update
        AuthState.getInstance().updateState();
    }

    private logOut(e: any) {
        AuthState.getInstance().deauthorize();
        WMFORequest.getInstance().removeAuthHeader();
        setTimeout(() => browserHistory.push('/'), 100);
    }

    render() {
        const djNavbar = (
            <div>
                <li><Link to="/show_form">Request Show Form</Link></li>
                <li><Link to="/volunteer_form">Log Volunteer Hours</Link></li>
                <li><Link to="/links">Important Links</Link></li>
            </div>
        );
        const execNavbar = (
            <div>
                <li><Link to="/add_users">Add Users</Link></li>
                <li><Link to="/review_hours">Review Volunteer Hours</Link></li>
            </div>
        );
        const signedInNavbar = (
            <li><a href="javaScript:void(0);" onClick={this.logOut}>Log Out</a></li>
        );

        const defaultNavbar = (
            <li><Link to="/contact">Contact Us</Link></li>
        );

        const navbarInternals: JSX.Element[] = [];
        this.state.user.caseOf({
            nothing: () => {
                navbarInternals.push(defaultNavbar);
            },
            just: (m: CommunityMemberRecord) => {
                const isExec: boolean = m.permissionLevels.some((level: PermissionLevel) => EXEC_BOARD_PERMISSIONS.indexOf(level) !== -1);
                const isDj: boolean = m.permissionLevels.some((level: PermissionLevel) => DJ_PERMISSIONS.indexOf(level) !== -1);
                const isWebmaster: boolean = m.permissionLevels.indexOf('WEBMASTER') !== -1;
                if (isDj) navbarInternals.push(djNavbar);
                if (isWebmaster || isExec) navbarInternals.push(execNavbar);
                navbarInternals.push(signedInNavbar);
            }
        });
        const navbar = (
            <ul>
                <li><Link to="/home">Home</Link></li>
                {navbarInternals}
            </ul>
        );
        const signInMessage = (
            <div id="signInMessage">
                {this.state.user.caseOf({
                    just: (m: CommunityMemberRecord) => `Signed In: ${m.email}`,
                    nothing: () => ''
                })}
            </div>
        );
        return (
            <div>
                <Link to="/">
                    <img id="logo" src="/dist/static/img/Logo-1.png" alt="WMFO"/>
                </Link>
                {signInMessage}
                {navbar}
                {this.props.children}
            </div>
        );
    }
};
ReactDOM.render((

    <Router history={browserHistory}>
        <Route path="/" component={App}>
            <IndexRoute component={Home} />
            <Route path="home" component={Home}/>
            <Route path="add_users" component={AddUsers}/>
            <Route path="show_form" component={ShowForm}/>
            <Route path="volunteer_form" component={Volunteer}/>
            <Route path="contact" component={Contact}/>
            <Route path="links" component ={Links}/>
            <Route path="*" component={Unknown}/>
        </Route>
    </Router>
), document.getElementById('wmfo-content'));
