// © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
// 
// This AWS Content is provided subject to the terms of the AWS Customer Agreement
// available at http://aws.amazon.com/agreement or other written agreement between
// Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.


/* api.js
   Contains functions used to interact with backend BRH endpoints */

import { getIdToken, logout, refresh } from "./oidc"

const base_url = process.env.REACT_APP_API_GW_ENDPOINT

const makeApiCall = async (apiCall, callback) => {
    /* Helper method to handle API calls and refresh token if we receive a 
    401 Unauthorized response from the API. This should be used to call all
    backend API endpoints 
        apiCall: async function used to make actual API Call to backend. 
        callback: Success callback function used to handle response from API call.
    */

    const response = await apiCall();
    if(response.ok ) {
        callback(response)
    } else if( response.status === 401) {
        /* Invalid Token, refresh. If this fails,
           the user logs out */
        await refresh()
        const retryResponse = await apiCall();

        if(retryResponse.ok) {
            callback(retryResponse)
        } else if( retryResponse.status === 401) {
            // The token is still no good. Logout.
            logout();
        } else {
            console.log("Error getting workspaces.")
        }
    }

}

/***************  getWorkspaces **************************/
export const getWorkspaces = (callback) => {
    makeApiCall(getWorkspacesResponse, async (resp) => {
        const data = await resp.json()
        callback(data)
    })
}
const getWorkspacesResponse = async () => {
    const api = `${base_url}/workspaces`
    const id_token = getIdToken()
    if( id_token == null ) {
        console.log("Error getting id token before getting workspaces")
        logout();
    }

    const headers = {
		'Content-Type': 'application/json',
        'Authorization': `Bearer ${id_token}`
	}
    const response = await fetch(api, {headers: headers})
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
    const api = `${base_url}/workspaces`
    const id_token = getIdToken()
    if( id_token == null ) {
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
    const api = `${base_url}/workspaces/${workspace_id}/limits`
    const id_token = getIdToken()
    if( id_token == null ) {
        logout();
    }

    const headers = {
		'Content-Type': 'application/json',
        'Authorization': `Bearer ${id_token}`
    }

    console.log("Setting limits");

    const response = await fetch(api, {
        method: 'PUT',
        body: JSON.stringify(limits), 
        headers: headers
    })
    return response
}
