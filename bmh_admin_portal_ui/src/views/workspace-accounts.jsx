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

const WorkspaceAccounts = () => {
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true);
    getWorkspaces((data) => {
      setLoading(false)
      setWorkspaces(data)
    })
  }, [])

  const dollar_formatter = (cell, row) => "$" + cell
  const editable_header_formatter = (col, colIndex, components) => (<span>{col.text} <BiEditAlt /></span>)

  const no_data_indication = () => {
    return (
      <p>No active workspaces to view.</p>
    )
  }

  const soft_limit_validator = (newValue, row, column) => {
    let valid = true
    let message = ""
    if( newValue >= row['hard-limit'] ) {
      valid = false
      message = "Soft limit must be less than hard limit."
    } else if( newValue <= 0 ) {
      valid = false
      message = "Soft limit must be greater than 0 (zero)."
    }

    if( valid ) {
      return true
    } else {
      return {
        valid: false,
        message: message
      }
    }
  }

  const hard_limit_validator = (newValue, row, column) => {
    let valid = true
    let message = ""
    if( newValue <= row['soft-limit'] ) {
      valid = false
      message = "Hard limit must be greater than soft limit."
    } else if( newValue <= 0 ) {
      valid = false
      message = "Hard limit must be greater than 0 (zero)."
    } else if( row['strides-credits'] !== null && newValue > row['strides-credits'] ) {
      valid = false
      message = "Hard limit must be less than or equal to the Strides Credits amount."
    }

    if( valid ) {
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
  },{
    dataField: 'request_status',
    text: 'Request Status',
    editable: false
  },{
    dataField: 'total-usage',
    text: 'Total Usage',
    editable: false,
    formatter: dollar_formatter
  },{
    dataField: 'strides-credits',
    text: 'Strides Credits',
    editable: false,
    formatter: dollar_formatter
  },{
    dataField: 'soft-limit',
    text: 'Soft Limit',
    editable: true,
    formatter: dollar_formatter,
    headerFormatter: editable_header_formatter,
    validator: soft_limit_validator
  },{
    dataField: 'hard-limit',
    text: 'Hard Limit',
    editable: true,
    formatter: dollar_formatter,
    headerFormatter: editable_header_formatter,
    validator: hard_limit_validator
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
        <h2>Workspace Accounts</h2>
      </div>
  
      <div className="py-5 text-center">
        <BootstrapTable keyField='bmh_workspace_id' data={ workspaces } columns={ columns }
          hover={true} bordered={true} cellEdit={cellEdit} noDataIndication={no_data_indication} 
          loading={loading} overlay={ overlayFactory({ spinner: true, background: 'rgba(192,192,192,0.1)' }) }/>
      </div>
  
      <Link to="/request-workspace" className="btn btn-primary btn-lg mb-6">Request New Workspace</Link>
    
    </div>
  )

}
export default WorkspaceAccounts;
