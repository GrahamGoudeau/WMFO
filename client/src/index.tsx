import * as React from "react";
import * as ReactDOM from "react-dom";
import { Router, Route, browserHistory, IndexRoute } from "react-router"
import {Link} from "react-router";
import { Home } from "./components/Home";
import { About } from "./components/About";
import { ShowForm } from "./components/ShowForm"
import { ExecVolunteerReview, DJVolunteer } from "./components/Volunteer";
import { ManageSchedule } from "./components/ManageSchedule";
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
import WMFOStyles from "./ts/styles";

interface AppState {
    user: Maybe<CommunityMemberRecord>;
}

class NavbarLi extends React.Component<{}, {}> {
    constructor(props: any) {
        super(props);
    }

    render() {
        return <li style={WMFOStyles.NAVBAR_ITEM_STYLE}>{this.props.children}</li>
    }
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
                <li><Link to="/manage_schedule">Manage Schedule</Link></li>
                <li><Link to="/review_hours">Review Volunteer Hours</Link></li>
                <li><Link to="/pending_members">Pending Members</Link></li>
            </div>
        );
        const signedInNavbar = (
            <li><a href="javaScript:void(0);" onClick={this.logOut}>Log Out</a></li>
        );

        const defaultNavbar = (
            <NavbarLi><Link to="/contact">Contact Us</Link></NavbarLi>
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
            <ul className="navbar" style={WMFOStyles.NAVBAR_STYLE}>
                <NavbarLi><Link to="/">{AuthState.getInstance().getState().isJust() ? 'Home' : 'Log In'}</Link></NavbarLi>
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
            <div style={WMFOStyles.GLOBAL_STYLE}>
                <div>
                    <div>
                        <Link to="/">
                            <img style={WMFOStyles.LOGO_STYLE} src="/dist/static/img/Logo-1.png" alt="WMFO"/>
                        </Link>
                        <div style={WMFOStyles.SIGN_IN_MESSAGE}>
                            {signInMessage}
                            <br/>
                            WebMaster: grahamgoudeau@gmail.com
                        </div>
                    </div>
                    {navbar}
                </div>
                <div>
                    {this.props.children}
                </div>
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
            <Route path="/manage_schedule" component={ManageSchedule}/>
            <Route path="/review_hours" component={ExecVolunteerReview}/>
            <Route path="/contact" component={Contact}/>
            <Route path="/links" component ={Links}/>
            <Route path="/*" component={Unknown}/>
        </Route>
    </Router>
), document.getElementById('wmfo-content'));
