// © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
//
// This AWS Content is provided subject to the terms of the AWS Customer Agreement
// available at http://aws.amazon.com/agreement or other written agreement between
// Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import LogoutButton from './logout-button';

const NavBar = ({isAuthenticated}) => {

	let auth_control = (
		<li className="nav-item logout-btn"></li>
	)

	if(isAuthenticated) {
		auth_control = (
			<li className="nav-item logout-btn">
				<LogoutButton />
			</li>
		)
	}

	return (
		<nav className="navbar navbar-expand-lg navbar-dark bg-dark">
		<div className="container">
			  <Link className="navbar-brand" to="/">Biomedical Research Hub</Link>
			  <ul className="navbar-nav mr-auto">
				<li className="nav-item">
					<NavLink exact activeStyle={{fontWeight:"bold"}} className="nav-link" to="/">Accounts</NavLink>
				</li>
				<li className="nav-item">
					<NavLink exact activeStyle={{fontWeight:"bold"}} className="nav-link" to="/request-workspace">Request Workspace</NavLink>
				</li>
				{auth_control}
			</ul>
		</div>
	  </nav>
	)

};

export default NavBar;
