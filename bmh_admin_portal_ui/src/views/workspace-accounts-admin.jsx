// © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
//
// This AWS Content is provided subject to the terms of the AWS Customer Agreement
// available at http://aws.amazon.com/agreement or other written agreement between
// Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

import React, { useState, useEffect } from 'react';
import { BiEditAlt, BiSortAlt2 } from 'react-icons/bi';
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
const DIRECT_PAY = 'Direct Pay';

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
      data.sort((a, b) => {
        let a_id = a.user_id;
        let b_id = b.user_id;
        if (a_id < b_id) {
          return -1;
        }
        if (a_id > b_id) {
          return 1;
        }
        return 0;
      });
      setLoading(false)
      setWorkspaces(data)
    })
  }, [])

  const dollar_formatter = (cell, row) => {if (typeof cell != "undefined") {return "$" + cell} else return ""}
  const total_amount_formatter = (cell, row) =>
  {
    if (row['workspace_type'] === DIRECT_PAY && typeof row['direct_pay_limit'] != "undefined")
    {
      return "$" + row['direct_pay_limit']
    }
    else if (typeof cell != "undefined")
    {
      return "$" + cell
    }
    else
    {
      return ""
    }
  }
  const editable_header_formatter = (col, colIndex, components) => (<span>{col.text} <BiEditAlt /></span>)
  const capitalize_word_formatter = (cell, row) => cell.charAt(0).toUpperCase() + cell.slice(1)
  const sortable_header_formatter = (col, colIndex, components) => (<span>{col.text} <BiSortAlt2 /></span>)

  const no_data_indication = () => {
    return (
      <p>No active workspaces to view.</p>
    )
  }

  const columns = [{
    dataField: 'user_id',
    text: 'User Id',
    editable: false,
    sort: true,
    headerFormatter : sortable_header_formatter
  },{
    dataField: 'account_id',
    text: 'AWS Account',
    editable: true,
    sort: true,
    headerFormatter: editable_header_formatter
  },{
    dataField: 'request_status',
    text: 'Request Status',
    editable: false,
    sort: true,
    headerFormatter : sortable_header_formatter,
    formatter: capitalize_word_formatter
  },{
    dataField: 'workspace_type',
    text: 'Workspace Type',
    editable: false,
    sort: true,
    headerFormatter : sortable_header_formatter
  },{
    dataField: 'total-usage',
    text: 'Total Usage',
    editable: false,
    sort: true,
    formatter: dollar_formatter,
    headerFormatter : sortable_header_formatter
  },{
    dataField: 'soft-limit',
    text: 'Soft Limit',
    editable: false,
    sort: true,
    formatter: dollar_formatter,
    headerFormatter : sortable_header_formatter
  },{
    dataField: 'hard-limit',
    text: 'Hard Limit',
    editable: false,
    sort: true,
    formatter: dollar_formatter,
    headerFormatter : sortable_header_formatter
  },{
    dataField: 'strides-credits',
    text: 'Total Funds',
    editable: false,
    sort: true,
    formatter: total_amount_formatter,
    headerFormatter : sortable_header_formatter
  },{
    dataField: 'root_account_email',
    text: 'Root Email',
    editable: false,
    sort: true,
    headerFormatter : sortable_header_formatter
  },{
    dataField: 'ecs',
    text: 'ECS',
    editable: false,
    sort: true,
    headerFormatter : sortable_header_formatter
  },{
    dataField: 'subnet',
    text: 'Subnet',
    editable: false,
    sort: true,
    headerFormatter : sortable_header_formatter
  },{
    dataField: 'scientific_poc',
    text: 'Scientific POC',
    editable: false,
    sort: true,
    headerFormatter : sortable_header_formatter
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
