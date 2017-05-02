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


class App extends React.Component<undefined, undefined> {
    render() {
        return (
            <div>
            <a href="">
                          <img id="logo" src="https://www.wmfo.org/wp-content/uploads/2016/01/Logo-1.png" alt="WMFO"  />

                        </a>

                        <div id="phone">Call in! 855-915-WMFO</div>

                        <ul>
                          <li><Link to ="/">Home</Link></li>
                          <li><Link to="/contact">Contact</Link></li>
                          <li><Link to="/about">About</Link></li>
                          <li><Link to="/show_form">Show Form</Link></li>
                          <li><Link to="/volunteer_form">Log Volunteer Hours</Link></li>
                          <li><Link to="/links">Important Links</Link></li>
                        </ul>

            {this.props.children}
            </div>
        )
    }
};
ReactDOM.render((

    <Router history={browserHistory}>
        <Route path="/" component={App}>
            <IndexRoute component={Home} />
            <Route path="about" component={About}/>
            <Route path="home" component={Home}/>
            <Route path="show_form" component={ShowForm}/>
            <Route path="volunteer_form" component={Volunteer}/>
            <Route path="contact" component={Contact}/>
            <Route path="links" component ={Links}/>
            <Route path="*" component={Unknown}/>
        </Route>
    </Router>
), document.getElementById('wmfo-content'));
