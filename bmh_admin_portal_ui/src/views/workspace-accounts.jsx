// © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
//
// This AWS Content is provided subject to the terms of the AWS Customer Agreement
// available at http://aws.amazon.com/agreement or other written agreement between
// Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BiEditAlt } from 'react-icons/bi';
import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import overlayFactory from 'react-bootstrap-table2-overlay';
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

import { getWorkspaces, setWorkspaceLimits } from "../util/api"
import {
  authorizeAdmin,
} from '../util/auth';

const WorkspaceAccounts = () => {
  const [workspaces, setWorkspaces] = useState([])
  const [occworkspaces, setOCCWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [adminAuthorized, setAdminAuthorized] = useState(false)

  useEffect(() => {
    setLoading(true);
    async function fetchAuthorized() {
      const adminAuthorized = await authorizeAdmin();
      setAdminAuthorized(adminAuthorized);
    }
    fetchAuthorized();
    getWorkspaces((data) => {
      let occData = [];
      let stridesData = [];
      let i = 0;
      while (i < data.length){
        if(data[i].workspace_type == "Direct Pay"){
            occData.push(data[i]);
        }
        else{
          stridesData.push(data[i]);
        }
      
       i++;
      }
      setLoading(false);
      setWorkspaces(stridesData);
      setOCCWorkspaces(occData);
    })
  }, [])
  
  const dollar_formatter = (cell, row) => "$" + cell
  const editable_header_formatter = (col, colIndex, components) => (<span>{col.text} <BiEditAlt /></span>)
  const capitalize_word_formatter = (cell, row) => cell.charAt(0).toUpperCase() + cell.slice(1)
  const admin_link = (adminAuthorized) ? <Link to="/admin" className="btn ml-5 btn-warning btn-lg my-6">Administrate Workspace</Link> : null
  const no_data_indication = () => {
    return (
      <p>No active workspaces to view.</p>
    )
  }

  const soft_limit_validator = (newValueStr, row, column) => {
    let valid = true
    let message = ""
    let newValue = parseInt(newValueStr)
    let hardLimit = parseInt(row['hard-limit'])
    if (newValue >= hardLimit) {
      valid = false
      message = "Soft limit must be less than hard limit."
    } else if (newValue <= 0) {
      valid = false
      message = "Soft limit must be greater than 0 (zero)."
    }

    if (valid) {
      return true
    } else {
      return {
        valid: false,
        message: message
      }
    }
  }

  const hard_limit_validator = (newValueStr, row, column) => {
    let valid = true
    let message = ""
    let newValue = parseInt(newValueStr)
    let softLimit = parseInt(row['soft-limit'])
    if (newValue <= softLimit) {
      valid = false
      message = "Hard limit must be greater than soft limit."
    } else if (newValue <= 0) {
      valid = false
      message = "Hard limit must be greater than 0 (zero)."
    } else if (row['strides-credits'] !== null) {
      let creditsAmt = parseInt(row['strides-credits'])
      if (newValue > creditsAmt && creditsAmt !== 0) {
        valid = false
        message = "Hard limit must be less than or equal to the Strides Credits amount."
      }
    }

    if (valid) {
      return true
    } else {
      return {
        valid: false,
        message: message
      }
    }
  }

  const columns = [{
    dataField: 'nih_funded_award_number',
    text: 'NIH Award/Grant ID',
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
    dataField: 'soft-limit',
    text: 'Soft Limit',
    editable: true,
    formatter: dollar_formatter,
    headerFormatter: editable_header_formatter,
    validator: soft_limit_validator
  }, {
    dataField: 'hard-limit',
    text: 'Hard Limit',
    editable: true,
    formatter: dollar_formatter,
    headerFormatter: editable_header_formatter,
    validator: hard_limit_validator
  }, {
    dataField: 'access-link',
    text: 'Workspaces Link',
    formatter: (cell, row) => <a href={'https://' + process.env.REACT_APP_OIDC_AUTH_URI.split("/")[2]} target="_blank" rel="noreferrer">Link </a> , // By passing row variable to values I got all the contents of my datafields
    editable: false,
    isDummyField: true,
  }]
  
  const columnsdirectpay = [{
    dataField: 'bmh_workspace_id',
    text: 'OCC Request ID',
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
    dataField: 'direct_pay_limit',
    text: 'Compute Purchased',
    editable: false,
    formatter: dollar_formatter
  }, {
    dataField: 'soft-limit',
    text: 'Soft Limit',
    editable: false,
    formatter: dollar_formatter,
  }, {
    dataField: 'hard-limit',
    text: 'Hard Limit',
    editable: false,
    formatter: dollar_formatter,
  }, {
    dataField: 'access-link',
    text: 'Workspaces Link',
    formatter: (cell, row) => <a href={'https://' + process.env.REACT_APP_OIDC_AUTH_URI.split("/")[2]} target="_blank" rel="noreferrer">Link </a> , // By passing row variable to values I got all the contents of my datafields
    editable: false,
    isDummyField: true,
  }]

  const cellEdit = cellEditFactory({
    mode: 'click',
    beforeSaveCell: (oldValue, newValue, row, column) => {
      const limits = {
        'hard-limit': row['hard-limit'],
        'soft-limit': row['soft-limit']
      }
      limits[column['dataField']] = newValue
      setWorkspaceLimits(row['bmh_workspace_id'], limits)

    }
  })

  return (
    <div className="container">
      <div className="py-5 text-center">
        <h2>STRIDES Credit Workspace Accounts</h2>
      </div>

      <div className="pt-5 text-center">
        <BootstrapTable keyField='bmh_workspace_id' data={workspaces} columns={columns} noDataIndication={no_data_indication}
          hover={true} cellEdit={cellEdit} bordered={true}
          loading={loading} overlay={overlayFactory({ spinner: true, background: 'rgba(192,192,192,0.1)' })}
        />
      </div>
      <div className="my-2 p-5"><small><em className="font-weight-bold">Warning:</em> When a Workspace reaches the STRIDES Credits limit (for STRIDES Credits Workspaces)
        or reaches the Hard Limit (for STRIDES Grant Workspaces), the Workspace will be automatically terminated.
        Please be sure to save any work before reaching the STRIDES Credit or Hard Limit.</small></div>
       <div className="py-5 text-center">
        <h2>OCC Direct Pay Workspace Accounts</h2>
      </div>
      <div className="pt-5 text-center">
        <BootstrapTable keyField='directpay_workspace_id' data={occworkspaces} columns={columnsdirectpay} noDataIndication={no_data_indication}
          hover={true} cellEdit={cellEdit} bordered={true}
          loading={loading} overlay={overlayFactory({ spinner: true, background: 'rgba(192,192,192,0.1)' })}
        />
        <div className="my-2 p-5"><small><em className="font-weight-bold">Warning:</em> When a Workspace reaches the soft limit, OCC will send an email requesting more funds be added to your account. If it reaches the hard limit and further payment is not processed, the workspace will automatically be terminated. Please be sure to save any work before reaching the Hard Limit.</small></div>
      </div>
      <Link to="/request-workspace" className="btn btn-primary btn-lg my-6">Request New Workspace</Link>
      {admin_link}
    </div>
  )

}
export default WorkspaceAccounts;
