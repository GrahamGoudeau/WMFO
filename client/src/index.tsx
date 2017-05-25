import * as React from "react";
import * as ReactDOM from "react-dom";
import { Router, Route, browserHistory, IndexRoute } from "react-router"
import {Link} from "react-router";
import { Home } from "./components/Home";
import { About } from "./components/About";
import { ShowForm } from "./components/ShowForm"
import { ExecVolunteerReview, DJVolunteer } from "./components/Volunteer";
import { Contact } from "./components/Contact";
import { Links } from "./components/Links";
import { Unknown } from "./components/Unknown";
import { AddUsers } from "./components/AddUsers";
import { ManageUsers } from "./components/ManageUsers";
import WMFORegister from "./components/Register";
import PendingMembers from "./components/PendingMembers";
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
        browserHistory.push('/');
    }

    render() {
        const djNavbar = (
            <div>
                <li><Link to="/show_form">Request Show Form</Link></li>
                <li><Link to="/volunteer_hours">Volunteer Hours</Link></li>
                <li><Link to="/links">Important Links</Link></li>
            </div>
        );
        const execNavbar = (
            <div>
                <li><Link to="/add_users">Add Users</Link></li>
                <li><Link to="/manage_users">Manage Users</Link></li>
                <li><Link to="/review_hours">Review Volunteer Hours</Link></li>
                <li><Link to="/pending_members">Pending Members</Link></li>
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
                <li><Link to="/">{AuthState.getInstance().getState().isJust() ? 'Home' : 'Log In'}</Link></li>
                {navbarInternals}
            </ul>
        );
        const signInMessage = (
                this.state.user.caseOf({
                    just: (m: CommunityMemberRecord) => `Signed In: ${m.email}`,
                    nothing: () => ''
                })
        );
        return (
            <div style={{ width: '100%', height: '100%'}}>
                <Link to="/">
                    <img id="logo" src="/dist/static/img/Logo-1.png" alt="WMFO"/>
                </Link>
                <div id="signInMessage">
                    {signInMessage}
                    <br/>
                    WebMaster: grahamgoudeau@gmail.com
                </div>
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
            <Route path="/register/:code" component={WMFORegister}/>
            <Route path="/pending_members" component={PendingMembers}/>
            <Route path="/add_users" component={AddUsers}/>
            <Route path="/manage_users" component={ManageUsers}/>
            <Route path="/show_form" component={ShowForm}/>
            <Route path="/volunteer_hours" component={DJVolunteer}/>
            <Route path="/review_hours" component={ExecVolunteerReview}/>
            <Route path="/contact" component={Contact}/>
            <Route path="/links" component ={Links}/>
            <Route path="/*" component={Unknown}/>
        </Route>
    </Router>
), document.getElementById('wmfo-content'));
