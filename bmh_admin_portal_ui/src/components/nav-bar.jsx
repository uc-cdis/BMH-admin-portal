import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from './logout-button';
/* eslint-disable */

class NavBar extends Component {
	state = {}
	render() {

		const { isAuthenticated } = this.props;

		let body;
		if (isAuthenticated) {
			body = (
				<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
				<div class="container">
		      <Link class="navbar-brand" to="/">Biomedical Hub</Link>
		      <ul class="navbar-nav mr-auto">
		        <li class="nav-item active">
		          <Link class="nav-link" to="/">Accounts</Link>
		        </li>
		        <li class="nav-item">
		          <Link class="nav-link" to="/request-workspace">Request Workspace</Link>
		        </li>
		        <li class="nav-item logout-btn">
		          <LogoutButton />
		        </li>
		      </ul>
		      {/*<div id="user_info" class="nav-item" style={{display:"none"}}>
		        <span class="text-white" id="user_email" >Not Logged In: ERROR</span>
		        <a to="#" id="logout" class="ml-1 text-secondary"><small>(Logout)</small></a>
		      </div>*/}
		    </div>  
		  </nav>
			)
		}

		return (
			<div>
				{body}
			</div>
		)
	}
}

// export default withAuth0(NavBar);
export default NavBar;
