import * as React from "react";
{/*import {Link} from "react-router";*/}
export interface HomeProps { compiler: string; framework: string; }

export class Home extends React.Component<HomeProps, undefined> {
    render() {
    	return (
    		<div id="home">
    					{/*
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
						</ul>
						*/}

						<div id="main">
						<div id="user"><h1>User Profile</h1>
               			 	<ul>
               			 		<li><a>Name:</a></li>

               			 		<li><a>DJ Name:</a></li>
               			 	</ul>
						</div>

						  <div id="studio">
						  
						   	<img id="studio_pic" src="https://www.wmfo.org/wp-content/uploads/2017/02/WmfoStudioAMainBoardPano.2016.04.01.CC-By-EdwardBeuchert.Large_-1.jpg" alt="Studio"/>
						  </div>
						</div>
			</div>
		);
    }
}
