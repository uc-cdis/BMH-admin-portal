// © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
//
// This AWS Content is provided subject to the terms of the AWS Customer Agreement
// available at http://aws.amazon.com/agreement or other written agreement between
// Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

import React, { useState, useEffect } from 'react';
import { BiEditAlt } from 'react-icons/bi';
import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import overlayFactory from 'react-bootstrap-table2-overlay';
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import LoadingOverlay from 'react-loading-overlay'
import { approveWorkspace, getAdminWorkspaces } from "../util/api"
import { authorizeAdmin } from '../util/auth';

// Added this to avoid warning in unit tests.
// Error: `Failed prop type: LoadingOverlayWrapper: prop type `styles.content` is invalid;`
LoadingOverlay.propTypes = undefined;

const WorkspaceAccountsAdmin = () => {
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  /* eslint-disable */
  const [adminAuthorized, setAdminAuthorized] = useState(false)

  useEffect(() => {
    async function fetchAuthorized() {
      const adminAuthorized = await authorizeAdmin();
      setAdminAuthorized(adminAuthorized);
    }
    setLoading(true);
    fetchAuthorized();
    getAdminWorkspaces((data) => {
      setLoading(false)
      setWorkspaces(data)
    })
  }, [])

  const dollar_formatter = (cell, row) => "$" + cell
  const editable_header_formatter = (col, colIndex, components) => (<span>{col.text} <BiEditAlt /></span>)
  const capitalize_word_formatter = (cell, row) => cell.charAt(0).toUpperCase() + cell.slice(1)

  const no_data_indication = () => {
    return (
      <p>No active workspaces to view.</p>
    )
  }


  const columns = [{
    dataField: 'scientific_poc',
    text: 'Scientific POC',
    editable: false
  },{
    dataField: 'user_id',
    text: 'User Id',
    editable: false
  }, {
    dataField: 'request_status',
    text: 'Request Status',
    editable: false,
    formatter: capitalize_word_formatter
  }, {
    dataField: 'workspace_type',
    text: 'Workspace Type',
    editable: false
  }, {
    dataField: 'total-usage',
    text: 'Total Usage',
    editable: false,
    formatter: dollar_formatter
  }, {
    dataField: 'strides-credits',
    text: 'Strides Credits',
    editable: false,
    formatter: dollar_formatter
  }, {
    dataField: 'root_account_email',
    text: 'Root Email',
    editable: false,
  }, {
    dataField: 'account_id',
    text: 'AWS Account',
    editable: true,
    headerFormatter: editable_header_formatter,
  }]

  const cellEdit = cellEditFactory({
    mode: 'click',

    beforeSaveCell: (oldValue, newValue, row, column, done) => {
      setTimeout(() => {
        if (window.confirm('Do you want to approve this workspace?')) {
          console.log("oldValue: " + oldValue)
          console.log("newValue: " + newValue)
          console.log("column: ")
          console.log(column)
          const account = {
            'account_id': newValue
          }
          account[column['dataField']] = newValue
          approveWorkspace(row['bmh_workspace_id'], account)
          done(); // contine to save the changes
        } else {
          done(false); // reject the changes
        }
      }, 0);
      return { async: true };

    }
  })

  return (
    <div className="scroll width-full">
      <div className="mx-5">
        <div className="text-center">
          <h2>Workspace Accounts Administration</h2>
          <div className="my-2 p-5">
            <small>
              <em className="font-weight-bold">Warning: </em>
              When you fill out the AWS Account Id for a pending request, a process is kicked off in the backend to deploy cost tracking infrastructure to that account. Make sure you don't have any typos in the account id and that it matches the request.
              This will only work for pending, failed or erronous requests.
              Requests that are in active or provisioning state will not have any effect.
              To change the account id of an existing row please contact the platform team.
            </small>
          </div>
        </div>

        <div className="pbt-5 text-center scroll">
          <BootstrapTable keyField='bmh_workspace_id' data={workspaces} columns={columns} noDataIndication={no_data_indication}
            hover={true} cellEdit={cellEdit} bordered={true} classes='table-class'
            loading={loading} overlay={overlayFactory({ spinner: true, background: 'rgba(192,192,192,0.1)' })}
          />
        </div>
      </div>
    </div>
  )

}
export default WorkspaceAccountsAdmin;
