// © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
//
// This AWS Content is provided subject to the terms of the AWS Customer Agreement
// available at http://aws.amazon.com/agreement or other written agreement between
// Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.


/* api.js
   Contains functions used to interact with backend BRH endpoints */

import { getIdToken, logout, refresh } from "./oidc"

const baseUrl = process.env.REACT_APP_API_GW_ENDPOINT

const makeApiCall = async (apiCall, callback) => {
  /* Helper method to handle API calls and refresh token if we receive a
  401 Unauthorized response from the API. This should be used to call all
  backend API endpoints
      apiCall: async function used to make actual API Call to backend.
      callback: Success callback function used to handle response from API call.
  */

  const response = await apiCall();
  if (response.ok) {
    callback(response)
  } else if (response.status === 401) {
    /* Invalid Token, refresh. If this fails,
       the user logs out */
    await refresh()
    const retryResponse = await apiCall();

    if (retryResponse.ok) {
      callback(retryResponse)
    } else if (retryResponse.status === 401) {
      // The token is still no good. Logout.
      logout();
    } else {
      console.log("Error calling API.")
    }
  }

}

/***************  getWorkspaces **************************/
export const getWorkspaces = (callback) => {
  makeApiCall(getWorkspacesResponse, async (resp) => {
    let data = []
    // 204 No Content
    if (resp.status !== 204) {
      data = await resp.json()
    }
    callback(data)
  })
}

const getWorkspacesResponse = async () => {
  const api = `${baseUrl}/workspaces`
  const id_token = getIdToken()
  if (id_token == null) {
    console.log("Error getting id token before getting workspaces")
    logout();
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${id_token}`
  }
  const response = await fetch(api, { headers: headers })
  return response
}

/***************  getAdminWorkspaces **************************/
export const getAdminWorkspaces = (callback) => {
  makeApiCall(getAdminWorkspacesResponse, async (resp) => {
    let data = []
    // 204 No Content
    if (resp.status !== 204) {
      console.log("Awaiting data, status: " + resp.status)
      data = await resp.json()
    }
    callback(data)
  })
}

const getAdminWorkspacesResponse = async () => {
  const api = `${baseUrl}/workspaces/admin_all`
  const id_token = getIdToken()
  if (id_token == null) {
    console.log("Error getting id token before getting workspaces")
    logout();
  }

  // TODO: ADD ADMIN AUTHZ CHECK HERE TOO?

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${id_token}`
  }
  const response = await fetch(api, { headers: headers })
  return response
}

/*************** requestWorkspace **************************/
export const requestWorkspace = (form_data, callback) => {
  makeApiCall(() => callRequestWorkspace(form_data), async (resp) => {
    await resp.json()
    callback()
  })
}

const callRequestWorkspace = async (form_data) => {
  const api = `${baseUrl}/workspaces`
  const id_token = getIdToken()
  if (id_token == null) {
    console.log("Error getting id token before getting workspaces")
    logout();
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${id_token}`
  }

  const response = await fetch(api, {
    method: 'POST',
    body: JSON.stringify(form_data),
    headers: headers
  })
  return response
}


/***************  setWorkspaceLimits **************************/
export const setWorkspaceLimits = (workspace_id, limits) => {
  makeApiCall(() => callSetWorkspaceLimits(workspace_id, limits), async (resp) => {
    await resp.json()
  })
}

const callSetWorkspaceLimits = async (workspace_id, limits) => {
  const api = `${baseUrl}/workspaces/${workspace_id}/limits`
  const id_token = getIdToken()
  if (id_token == null) {
    logout();
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${id_token}`
  }


  const response = await fetch(api, {
    method: 'PUT',
    body: JSON.stringify(limits),
    headers: headers
  })
  return response
}

/***************  ApproveWorkspace **************************/
export const approveWorkspace = (workspace_id, account_id) => {
  makeApiCall(() => callApproveWorkspace(workspace_id, account_id), async (resp) => {
    await resp.json()
  })
}

const callApproveWorkspace = async (workspace_id, account_id) => {
  const api = `${baseUrl}/workspaces/${workspace_id}/provision`
  const id_token = getIdToken()
  if (id_token == null) {
    logout();
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${id_token}`
  }

  const response = await fetch(api, {
    method: 'POST',
    body: JSON.stringify(account_id),
    headers: headers
  })
  return response
}
