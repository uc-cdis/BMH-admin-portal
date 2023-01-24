import React, { useState} from 'react';
import axios from 'axios';
import { BiHelpCircle } from 'react-icons/bi';
import ReactTooltip from 'react-tooltip';

/* Bootstrap Imports */
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import { getIdToken, logout } from "../../util/oidc";

const baseUrl = process.env.REACT_APP_API_GW_ENDPOINT
const occHelpURL = process.env.REACT_APP_OCC_HELPER_URL

const directpayinitialFormData = Object.freeze({
  workspace_type: "Direct Pay",
  poc_email: "accounts@" + process.env.REACT_APP_OCC_EMAIL_DOMAIN,
  confirm_poc_email: "accounts@" + process.env.REACT_APP_OCC_EMAIL_DOMAIN,
  summary_and_justification: "",
  project_short_title: "",
  workspace_use: " ",
  approved_creditcard: " ",
  project_role: " ",
  attestation: false,
});

const DirectPayForm = (props) => {

const [formData, updateFormData] = useState(directpayinitialFormData);
const [billingID, setBillingID] = useState('');
const [email, setEmail] = useState('');
const [requestApproved, setRequestApproved] = useState("");
const [title, setTitle] = useState('');
const [summary, setSummary] = useState('');
const [workspace_use, setWorkspaceUse] = useState('');
const [creditCard, setCreditCard] = useState('');
const [projectRole, setProjectRole] = useState('');
const [directpaylimit, setDirectPayLimit] = useState('');
const [buttonDisabled, setButtonDisabled] = useState(false);
const [buttonDisabledtoo, setButtonDisabledtoo] = useState(false);


let componentToRender;

const handleSubmit = event =>{
  event.preventDefault();
  
  var axios = require('axios');
  var data = '{\n    "queryStringParameters":{\n        "method": "confirmBillingID",\n        "brh_data" : {\n            "AGBillingID": "' + billingID + '",\n            "Email": "' + email + '"\n        }\n    }\n}    ';
  
  var config = {
    method: 'post',
    url: occHelpURL,
    headers: { 
      'Content-Type': 'text/plain'
    },
    data : data
  };
  
  axios(config)
  .then(function (response) {
    console.log(response.data.body[0])
    console.log(response.data.body[0]["Message"]["statusCode"])
    if(response.data.body[0]["Message"]["statusCode"] === 200){
        console.log("made it");
        setRequestApproved("true");
        setDirectPayLimit(response.data.body[0]["Message"]["body"]);
        setButtonDisabledtoo(true)
      }
      else{
        console.log("handle error");
        setRequestApproved("false");
      }
  })
  .catch(function (error) {
    console.log(error);
  });


}


const handleChange = event =>{
  
  if(event.target.name === 'project_short_title'){
    setTitle(event.target.value)
  }
  if(event.target.name === 'summary_and_justification'){
    setSummary(event.target.value)
  }
  if(event.target.name === 'workspace_use'){
    setWorkspaceUse(event.target.value)
  }
  if(event.target.name === 'approved_creditcard'){
    setCreditCard(event.target.value)
  }
  if(event.target.name === 'project_role'){
    setProjectRole(event.target.value)
  }
   updateFormData({
      ...formData,
      [event.target.name]: (event.target.type === "checkbox") ? event.target.checked : event.target.value.trim()
    })
}


const handleRequest = event =>{
  
  setButtonDisabled(true);
  event.preventDefault();
  const form = event.currentTarget;
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

  
  var axios = require('axios');
  var direct_pay_limit = `,"direct_pay_limit":` + directpaylimit + `}`
  var tempdata = JSON.stringify(formData)
  tempdata = tempdata.slice(0, tempdata.length - 1)
  var data = tempdata + direct_pay_limit;
  
  
  var config = {
    method: 'POST',
    url: api,
    headers: headers,
    data : data
  };
  
  
  axios(config)
  .then(function (response) {
    var reqid = (JSON.stringify(response.data.message));
    reqid = (reqid.slice(1, reqid.length - 1));
    requestAPICall(reqid);
  })
  
}

const requestAPICall = (reqid) => {
    var axios = require('axios');
    var data = '{\n    "queryStringParameters": \n    {\n        "method": "handleRequest",\n        "brh_data" : {\n            "AGBillingID": "' + billingID +'",\n            "Email": "' + email + '",\n            "ProjectTitle": "' + title + '",\n            "ProjectSummary": "' + summary +'",\n            "WorkspaceUse": "' + workspace_use +'",\n            "ApprovedCreditCard": "'+ creditCard +'",\n            "ProjectRole": "' + projectRole +'",\n            "RequestUUID": "' + reqid +'"\n        }\n    }\n}';

    var config = {
      method: 'post',
      url: occHelpURL,
      headers: { 
        'Content-Type': 'text/plain'
      },
      data : data
    };
    
    axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });
    
    window.location = '/';
}


if(requestApproved === "true"){
  componentToRender = (
  <div>
        <Form onSubmit={handleRequest}>
          <Form.Row className="mb-3">
          <Col>
          <Form.Check type="checkbox" name="attestation" label={`By filling out this form below, I consent to be invoiced by OCC the amount of $ ${(directpaylimit)}  to provision that amount of compute for my workspace. If this value is incorrect, please contact OCC to update your request amount.`} required />
          </Col>
          </Form.Row>
          <br></br>
          <Form.Label> Project Brief Title? <span data-tip data-for="project_short_title"><BiHelpCircle /></span></Form.Label>
          <ReactTooltip class="tooltip" id="project_short_title" place="top" effect="solid" multiline={true}>
            Please enter a brief title for your project
          </ReactTooltip>
          <Form.Control type="text" name="project_short_title" onChange={handleChange} placeholder="Enter Project Brief Title" />
          <br></br>
          <Form.Label> Brief Project Summary and Justification? <span data-tip data-for="summary_and_justification"><BiHelpCircle /></span></Form.Label>
          <ReactTooltip class="tooltip" id="summary_and_justification" place="top" effect="solid" multiline={true}>
            Please enter a brief summary and justification for your project.
          </ReactTooltip>
          <Form.Control type="text" name="summary_and_justification" onChange={handleChange} placeholder="Enter Brief Summary and Justification" />
          <br></br>
          <Form.Label> Workspace Use <span data-tip data-for="workspace_use"><BiHelpCircle /></span></Form.Label>
          <ReactTooltip class="tooltip" id="workspace_use" place="top" effect="solid" multiline={true}>
            Please select whether the workspace is intended for personal or organizational use.
          </ReactTooltip>
          <Form.Control as="select" name="workspace_use" onChange={handleChange} custom required >
            <option>{""}</option>
            <option>Personal</option>
            <option>Organizational</option>
          </Form.Control>
          <Form.Control.Feedback type="invalid">
            Please select yes or no
          </Form.Control.Feedback>
          <br></br>
          <br></br>
          <Form.Label> Do you have a credit card approved for use? <span data-tip data-for="approved_creditcard"><BiHelpCircle /></span></Form.Label>
          <ReactTooltip class="tooltip" id="approved_creditcard" place="top" effect="solid" multiline={true}>
            Please select whether or not you have a credit card approved for use.
          </ReactTooltip>
          <Form.Control as="select" name="approved_creditcard" onChange={handleChange} custom required >
            <option>{""}</option>
            <option>Yes</option>
            <option>No</option>
          </Form.Control>
          <Form.Control.Feedback type="invalid">
            Please select yes or no
          </Form.Control.Feedback>
          <br></br>
          <br></br>
          <Form.Label> Role on Project <span data-tip data-for="project_role"><BiHelpCircle /></span></Form.Label>
          <ReactTooltip class="tooltip" id="project_role" place="top" effect="solid" multiline={true}>
            Please select the option that best describes your role on the project.
          </ReactTooltip>
          <Form.Control as="select" name="project_role" onChange={handleChange} custom required >
            <option>{""}</option>
            <option>Principal Investigator</option>
            <option>Co-Principal Investigator</option>
            <option>Co-Investigator</option>
            <option>Administrator</option>
            <option>Clinical Collaborator</option>
            <option>Clinical Coordinator</option>
            <option>Data Analyst</option>
            <option>Data Manager</option>
            <option>Research Coordinator</option>
            <option>Other</option>
          </Form.Control>
          <Form.Control.Feedback type="invalid">
            Please select an option
          </Form.Control.Feedback>
          <Form.Control type="hidden" name="direct_pay_limit" value={directpaylimit} />
          <br></br>
          <br></br>
          <br></br>
          <Button type="submit" disabled={buttonDisabled}>Submit Request</Button>
        <br></br>
    </Form>
  </div>) 
}

else if(requestApproved === "false"){
  componentToRender = (<div>
      <Alert key= 'danger' variant='danger'>
          Cannot confirm BillingID. Confirm BillingID and email and try again, or contact OCC.
      </Alert>
    </div>
  )
}

  return(
      <div>
        <Form onSubmit={handleSubmit}>
              <Form.Label> BillingID <span data-tip data-for="billingID_help"><BiHelpCircle /></span></Form.Label>
              <ReactTooltip class="tooltip" id="billingID_help" place="top" effect="solid" multiline={true}>
                Enter the Billing ID provided from registration through the Payment Solutions Portal. <br />
                If you have not recieved a BillingID, please complete registration at: <href>https://va.occ-data.org/</href>
              </ReactTooltip>
              <Form.Control type="text" name="billingID" onChange={event => setBillingID(event.target.value)} placeholder="Enter BillingID" />
              <br></br>
              <Form.Label> First 3 Characters of Associated Email Address <span data-tip data-for="email_help"><BiHelpCircle /></span></Form.Label>
              <ReactTooltip class="tooltip" id="email_help" place="top" effect="solid" multiline={true}>
                Enter the first three characters of the email associated with your OCC BillingID. Ex: Email address JohnDoe@gmail.com should enter Joh in the box
              </ReactTooltip>
              <Form.Control type="text" name="email" onChange={event => setEmail(event.target.value)} placeholder="Enter First Three Characters of Email" />
              <br></br>
              <Button type="submit" disabled={buttonDisabledtoo}>Confirm BillingID</Button>
            <br></br>
            <br></br>
        </Form>
        {componentToRender}
        </div>
    )
    
}

export default DirectPayForm;