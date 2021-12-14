// © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
//
// This AWS Content is provided subject to the terms of the AWS Customer Agreement
// available at http://aws.amazon.com/agreement or other written agreement between
// Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

import React, { useState, useEffect } from 'react';
import { BiEditAlt } from 'react-icons/bi';
import Button from 'react-bootstrap/Button'
import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import overlayFactory from 'react-bootstrap-table2-overlay';
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

import { getAdminWorkspaces, setWorkspaceLimits } from "../util/api"
import { authorizeAdmin } from '../util/auth';

const WorkspaceAccountsAdmin = () => {
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
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

  const selectRow = {
    mode: 'radio',
    clickToSelect: true,
    clickToExpand: true
  };

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
    dataField: 'root_account_email',
    text: 'Root Email',
    editable: true,
  }, {
    dataField: 'account_id',
    text: 'AWS Account',
    editable: true,
    headerFormatter: editable_header_formatter,
  }]

  const cellEdit = cellEditFactory({
    mode: 'click',
    beforeSaveCell: (oldValue, newValue, row, column) => {
      const limits = {
        'hard-limit': row['hard-limit'],
        'soft-limit': row['soft-limit']
      }
      limits[column['dataField']] = newValue
      console.log("ROW:")
      console.log(row)
      setWorkspaceLimits(row['bmh_workspace_id'], limits)

    }
  })

  return (
    <div className="scroll width-full">
      <div className="mx-5">
        <div className="text-center">
          <h2>Workspace Accounts Administration</h2>
        </div>

        <div className="pbt-5 text-center scroll">
          <BootstrapTable keyField='bmh_workspace_id' data={workspaces} columns={columns} noDataIndication={no_data_indication}
            hover={true} cellEdit={cellEdit} bordered={true} classes='table-class'
            loading={loading} overlay={overlayFactory({ spinner: true, background: 'rgba(192,192,192,0.1)' })} selectRow={ selectRow }
          />
        <Button className="btn btn-primary btn-lg btn-block mb-6"
              type="submit"
              id="request-form-submit-button">
              Approve Request</Button>
        </div>
      </div>
    </div>
  )

}
export default WorkspaceAccountsAdmin;
