// © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
//
// This AWS Content is provided subject to the terms of the AWS Customer Agreement
// available at http://aws.amazon.com/agreement or other written agreement between
// Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';

import { validateState, login, removeTokens } from '../util/oidc';
import { authorizeLogin } from '../util/auth';

const params = (new URL(document.location)).searchParams;
const state = params.get('state');
const code = params.get('code');

const LoginCallback = ({ setParentAuthenticated }) => {
  const [toHome, setToHome] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const execute = async () => {
      try {
        const validState = validateState(state);
        if (!validState) throw new Error();

        await login(code);

        const authorized_login = await authorizeLogin();
        if (authorized_login) {
          setParentAuthenticated(true);
          setToHome(true);
        } else {
          removeTokens();
          setTimeout(() => setToHome(true), 10000)
          setUnauthorized(true);
        }

      } catch (err) {
        // Do NOTHING intentionally. Useful for debugging.
        //console.log("Error validating state or logging in. " + err)
      }
    }
    if (code !== null) {
      execute();
    }
    else {
      removeTokens();
      setTimeout(() => setToHome(true), 0) //Adding it in the setTimeout queue, since this can't be run directly
    }
  });

  if (toHome) {
    return (
      <Redirect to="/" />
    )
  }

  if (unauthorized) {
    return (
      <div className="container">
        <div className="mt-5 alert alert-danger" role="alert">
          <h5>Unauthorized. Please contact <a href={"mailto:" + process.env.REACT_APP_HELP_EMAIL}>{process.env.REACT_APP_HELP_EMAIL}</a> for access. You will be redirected shortly.</h5>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="mt-5 pt-2 alert alert-info" role="alert">
        <h5>Authenticating, you will be redirected shortly.</h5>
      </div>
    </div>
  )
}

export default LoginCallback;
