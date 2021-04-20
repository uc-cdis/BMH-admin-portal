import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

class WorkspaceAccounts extends Component {
  state = {
    workspaces: []
  }
  
  componentDidMount() {
    // Call the API Gateway endpoint for listing workspaces. 
    // Note: For development purporses, inlcude the user's email as a query string.
    
    const email = 'kggalens@amazon.com'
    const api = `${process.env.REACT_APP_API_GW_ENDPOINT}/workspaces?email=${email}`
    const headers = {
			'Content-Type': 'application/json',
			'X-Api-Key': `${process.env.REACT_APP_API_KEY}`
		}
    
    axios.get(api, { headers: headers })
    .then((response) => {
      //Update the react state with the workspace information from DynamoDB
      this.setState({
        workspaces: response.data
      });
    }, (error) => {
      console.log(error);
    });
  }

  renderTableData() {
    return this.state.workspaces.map((workspace, index) => {
       return (
          <tr key={index}>
             <td className="align-middle">{workspace['account_id']}</td>
             <td className="align-middle">${workspace['total-usage']}</td>
             <td className="align-middle">${workspace['strides-credits']}</td>
             <td className="align-middle">${workspace['soft-limit']}</td>
             <td className="align-middle">${workspace['hard-limit']}</td>
             <td className="align-middle"><button className="btn btn-secondary btn-sm btn-block" id="edit-limits-button">Edit</button></td>
          </tr>
       )
    })
 }

  render() {
    return (
      <div className="container">
          <div className="py-5 text-center">
            <h2>Workspace Accounts</h2>
          </div>
      
          {/*<div id="response-alert" className="alert" role="alert" 
            style= {{display:"none;position: absolute; top:25; left:50%; transform: translate(-50%,-50%);"}}>
            <p>This should be hidden and then shown</p>
          </div>*/}
      
          <table className="table table-sm table-bordered table-hover text-center align-middle">
            <caption>When the soft or hard is reached or exceeded, an email notification will be sent to the Workspace Admin.</caption>
            <thead className="thead-light">
              <tr>
                <th>Workspace Account ID</th>
                <th>Usage</th>
                <th>STRIDES Credits</th>
                <th>Soft Limit</th>
                <th>Hard Limit</th>
                <th>Edit Limits</th>
              </tr>
            </thead>
            <tbody>
              {this.renderTableData()}
            </tbody>
          </table>
      
          <Link to="/request-workspace" className="btn btn-primary btn-lg mb-6">Request New Workspace</Link>
        </div>
    )
  }
}

export default WorkspaceAccounts;
