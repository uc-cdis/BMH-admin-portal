// © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
//
// This AWS Content is provided subject to the terms of the AWS Customer Agreement
// available at http://aws.amazon.com/agreement or other written agreement between
// Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

import React, { Component } from 'react';
import LoginButton from '../components/login-button';

class LoginForm extends Component {
  handleSubmit = e => {
    e.preventDefault();
  }

  render() {
    return (
      <div className="container text-center">
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <h1>{(process.env.REACT_APP_DISPLAY_NAME) || 'BRH Portal'} Login</h1>
        <br/>
        <br/>
        <form onSubmit={this.handleSubmit}>
          <LoginButton />
        </form>
      </div>
    )
  }
}
export default LoginForm;
