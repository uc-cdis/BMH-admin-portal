// © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
//
// This AWS Content is provided subject to the terms of the AWS Customer Agreement
// available at http://aws.amazon.com/agreement or other written agreement between
// Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

import React, { useState, useEffect } from 'react'
import { Redirect, Route } from 'react-router-dom'
import {
  authorizeAdmin,
} from '../util/auth';
import { isAuthenticated } from "../util/oidc"

const AdminRoute = ({ component: Component, ...rest }) => {
  const [adminAuthorized, setAdminAuthorized] = useState(null);
  useEffect(() => {
    async function fetchAuthorized() {
      const adminAuthorized = await authorizeAdmin();
      setAdminAuthorized(adminAuthorized);
    }
    fetchAuthorized();
  }, []);

  const isLoggedIn = isAuthenticated()
  if (!isLoggedIn){
    return (
      <Route
        {...rest}
        render={props =>
          <Redirect to={{ pathname: '/', state: { from: props.location } }} />
        }
      />
    )
  }

  if(adminAuthorized===null){ //Only return <div/> if adminAuthorized equal to null, not when equal to false.
    return <div/>
  }

  return (
    <Route
      {...rest}
      render={props =>
        adminAuthorized ? (
          <Component {...props} />
        ) : (
          <Redirect to={{ pathname: '/', state: { from: props.location } }} />
        )
      }
    />
  )
}

export default AdminRoute
