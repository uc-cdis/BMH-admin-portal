// © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
//
// This AWS Content is provided subject to the terms of the AWS Customer Agreement
// available at http://aws.amazon.com/agreement or other written agreement between
// Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

/* auth.js
   Contains utility functions which interact with arborist for authorization
   purposes.
*/

import { getAccessToken, refresh, logout } from './oidc';
import config from '../config.json';

const axios = require('axios').default;
const resources = config['authorization']['resources']

export const authorizeLogin = async () => {
  const user_auth_mapping = await getUserAuthMapping();
  const credits_auth = await authorize(resources['CREDITS'], user_auth_mapping);
  const grants_auth = await authorize(resources['GRANTS'], user_auth_mapping);
  const admin_auth = await authorize(resources['ADMIN'], user_auth_mapping);
  return (grants_auth || credits_auth || admin_auth );
}

export const authorizeAdmin = async () => {
  const user_auth_mapping = await getUserAuthMapping();
  return authorize(resources['ADMIN'], user_auth_mapping);
}

export const authorizeCredits = async () => {
  const user_auth_mapping = await getUserAuthMapping();
  return authorize(resources['CREDITS'], user_auth_mapping);
}

export const authorizeGrants = async () => {
  const user_auth_mapping = await getUserAuthMapping();
  return authorize(resources['GRANTS'], user_auth_mapping);
}

const authorize = async (resourceMap, user_auth_mapping) => {
  const resource = resourceMap['resource']
  const serviceName = resourceMap['service']

  if (!user_auth_mapping || typeof (user_auth_mapping) === 'undefined') {
    console.log("User auth mapping was not defined");
    return false;
  }

  if (resource in user_auth_mapping) {
    // Looking for method = 'access' and service = 'workspace_admin'
    const authorized = user_auth_mapping[resource].some(function (service) {
      return service.method === 'access' && service.service === serviceName;
    });
    return authorized;
  } else {
    console.log("Resource " + resource + " did not exist in user auth mapping from Arborist.");
    return false;
  }

  // We souldn't ever get here, but in case something changes.
  /* eslint-disable */
  return false;
}

const getUserAuthMapping = async () => {
  // Get the access token. If undefined, log the user out
  // because this means they're probably not authenticated.
  let access_token = getAccessToken();
  if (access_token === "" || typeof (access_token) === 'undefined') {
    // TODO: Show error page here? For better UX
    console.log("Did not find access token in local storage, logging out.")
    logout();
  }

  let user_auth_mapping = await uamApiCall(access_token);
  if (!user_auth_mapping || typeof (user_auth_mapping) === 'undefined') {
    // Try to refresh if it didn't work the first time.
    console.log("Did not receive user auth mapping, trying to refresh.")
    await refresh();
    access_token = getAccessToken();
    user_auth_mapping = await uamApiCall(access_token);
  }

  if (!user_auth_mapping || typeof (user_auth_mapping) === 'undefined') {
    // If we still can't get it, log the user out.
    logout();
  }

  return user_auth_mapping;
}

const uamApiCall = async access_token => {
  const api = `${process.env.REACT_APP_ARBORIST_URI}`
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  }

  let user_auth_mapping;
  try {
    const resp = await axios.get(api, { headers: headers })
    user_auth_mapping = resp.data
  } catch (err) {
    // This may mean that our token is valid, but expired. Refresh and try again.
    console.log("Error getting user mapping from arborist: " + err);
  }

  return user_auth_mapping;
}
