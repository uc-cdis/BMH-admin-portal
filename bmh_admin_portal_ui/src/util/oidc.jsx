// © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
//
// This AWS Content is provided subject to the terms of the AWS Customer Agreement
// available at http://aws.amazon.com/agreement or other written agreement between
// Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

/* oidc.js
   Holds functions which interact with Authorization endpoints (Fence). */

import jwt_decode from 'jwt-decode';
import { v4 as uuidv4 } from 'uuid';

import config from '../config.json';

const axios = require('axios').default;

export const isAuthenticated = () => {
  const access_token = getAccessToken();
  if( access_token ) {
    return true
  }
  return false
}

export const getName = () => {
  const access_token = getAccessToken();
  if( access_token == null ) {
    return null
  }
  let name = "Unknown"
  try {
    const decoded = jwt_decode(access_token);
    name = decoded['context']['user']['name']
  } catch(err) {
    console.log("Could not retrieve name from id token");
  }
  return name
}

export const loadLoginScreen = () => {
    removeTokens();
    const state = uuidv4();
    const nonce = uuidv4();
    window.localStorage.setItem('state', state);
    window.localStorage.setItem('nonce', nonce);

    const auth_service = config['authentication']

    const redirect_location = [process.env.REACT_APP_OIDC_AUTH_URI,
        `?state=${state}&nonce=${nonce}`,
        '&response_type=code',
        `&client_id=${process.env.REACT_APP_OIDC_CLIENT_ID}`,
        `&redirect_uri=${process.env.REACT_APP_OIDC_REDIRECT_URI}`,
        `&idp=${auth_service}`,
        '&scope=openid%20user'
    ].join('');

    console.log("Redirecting to " + redirect_location);
    window.location.assign(redirect_location);
}

export const validateState = checkState => {
  const state = window.localStorage.getItem('state');
  window.localStorage.removeItem('state');
  return checkState === state;
}

/* Validates returned nonce against persisted nonce */
export const validateNonce = checkNonce => {
    const nonce = window.localStorage.getItem('nonce');
    window.localStorage.removeItem('nonce');
    return checkNonce === nonce;
}

export const getTokens = async code => {
  const api = `${process.env.REACT_APP_API_GW_ENDPOINT}/auth/get-tokens?code=${code}`
  const headers = {
    'Content-Type': 'application/json',
    'X-Api-Key': `${process.env.REACT_APP_API_KEY}`
  }

  let id_token;
  let refresh_token;
  let access_token;

  try {
    const resp = await axios.get(api, { headers: headers })
    id_token = resp.data['id_token']
    refresh_token = resp.data['refresh_token']
    access_token = resp.data['access_token']
  } catch (err) {
    console.log("Error getting tokens: " + err);
  }

  return { id_token, refresh_token, access_token }
}

export const getAccessToken = () => {
  return getToken('access_token');
}

export const getIdToken = () => {
  return getToken('id_token')
}

const getToken = tokenType => {
  const token = window.localStorage.getItem(tokenType);
  // In case an undefined value is stored
  if( typeof( token ) === 'undefined' ) {
    removeTokens();
  }
  return token;
}

export const login = async code => {
  const { id_token, refresh_token, access_token } = await getTokens(code);
  const decoded = jwt_decode(id_token);
  const validNonce = validateNonce(decoded['nonce']);
  if (!validNonce) {
    console.log("nonce was not valid")
    throw new Error()
  }
  window.localStorage.setItem('id_token', id_token);
  window.localStorage.setItem('refresh_token', refresh_token);
  window.localStorage.setItem('access_token', access_token);
}

export const logout = () => {
  removeTokens();
  window.location.reload();
}

export const removeTokens = () => {
  window.localStorage.removeItem('id_token');
  window.localStorage.removeItem('refresh_token');
  window.localStorage.removeItem('access_token');
}

export const refresh = async () => {
  const refresh_token = window.localStorage.getItem("refresh_token");
  if( refresh_token === null ) {
    console.log("Refresh token is null")
    logout()
  }

  const api = `${process.env.REACT_APP_API_GW_ENDPOINT}/auth/refresh-tokens`
  const headers = {
    'Content-Type': 'application/json',
    'X-Api-Key': `${process.env.REACT_APP_API_KEY}`
  }

  const data = {
    'refresh_token': refresh_token
  }

  try {
    console.log("Calling refresh tokens.")
    await axios.put(api, data, { headers: headers }).then((resp) => {
      window.localStorage.setItem('id_token', resp.data['id_token']);
      window.localStorage.setItem('refresh_token', resp.data['refresh_token']);
      window.localStorage.setItem('access_token', resp.data['access_token']);
    }).catch((error) => {
      console.log("Error refreshing tokens.")
    })
  } catch (err) {
    console.log("Catching error from axiox try");
    throw new Error();
  }
}
