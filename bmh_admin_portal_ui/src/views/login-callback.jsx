// © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
// 
// This AWS Content is provided subject to the terms of the AWS Customer Agreement
// available at http://aws.amazon.com/agreement or other written agreement between
// Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

import React, { useEffect, useState } from 'react';
import { Redirect, Link } from 'react-router-dom';

import { validateState, login, getName, removeTokens } from '../util/oidc';
import config from '../config.json';

const params = (new URL(document.location)).searchParams;
const state = params.get('state');
const code = params.get('code'); 

const LoginCallback = ({setParentAuthenticated}) => {
	const [toHome, setToHome] = useState(false);
	const [unauthorized, setUnauthorized] = useState(false);

	useEffect(() => {
		const execute = async () => {
			try {
				const validState = validateState(state);
				if (!validState) throw new Error();

				await login(code);

				// For development, check the list of users which can login.
				const authorized_emails = config['authorized_emails']
				const name = getName()
				if( !authorized_emails.includes(name) ) {
					removeTokens()
					setUnauthorized(true);					
				} else {				
					setParentAuthenticated(true);
					setToHome(true);
				}
				
			} catch (err) {
				// Do NOTHING intentionally. Useful for debugging.
				//console.log("Error validating state or logging in. " + err)
			}
		}
		if (code !== null) {
			execute();
		}
	});

	if(toHome) {
		return (
			<Redirect to="/" />
		)
	}

	if(unauthorized) {
		return (
			<div className="container">
				<div className="mt-5 alert alert-danger" role="alert">
					<h5>Unauthorized. This user is not authorized to access the site.</h5>
				</div>
			</div>
		)
	}

	return (	
		<div className="container">
			<div className="mt-5 alert alert-info" role="alert">
				<h5>Authenticating, you will be redirected shortly.</h5>
			</div>
		</div>
	)
}

export default LoginCallback;