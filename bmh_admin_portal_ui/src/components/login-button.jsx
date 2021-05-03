// © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
// 
// This AWS Content is provided subject to the terms of the AWS Customer Agreement
// available at http://aws.amazon.com/agreement or other written agreement between
// Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

import React from "react";

import { loadLoginScreen } from '../util/oidc';

const LoginButton = () => {
  const handleLoginClick = () => {
    loadLoginScreen();
  };

  return <button className="btn btn-primary" onClick={handleLoginClick}>Log In</button>;
};

export default LoginButton;
