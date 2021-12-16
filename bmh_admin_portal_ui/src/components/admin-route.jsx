// © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
//
// This AWS Content is provided subject to the terms of the AWS Customer Agreement
// available at http://aws.amazon.com/agreement or other written agreement between
// Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

import React from 'react'
import { Redirect, Route } from 'react-router-dom'
import {
  authorizeAdmin,
} from '../util/auth';
import { isAuthenticated } from "../util/oidc"

const AdminRoute = ({ component: Component, ...rest }) => {

  // Add your own authentication on the below line.
  const isAdmin = authorizeAdmin()
  const isLoggedIn = isAuthenticated()
  return (
    <Route
      {...rest}
      render={props =>
        isLoggedIn && isAdmin ? (
          <Component {...props} />
        ) : (
          <Redirect to={{ pathname: '/', state: { from: props.location } }} />
        )
      }
    />
  )
}

export default AdmineRoute
