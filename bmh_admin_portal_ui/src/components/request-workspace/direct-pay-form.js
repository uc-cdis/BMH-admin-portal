import React, {
    useState
} from 'react';
import {
    BiHelpCircle
} from 'react-icons/bi';
import ReactTooltip from 'react-tooltip';

/* Bootstrap Imports */
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import {
    requestWorkspace,
    callExternalURL
} from '../../util/api';

const occHelpURL = process.env.REACT_APP_OCC_HELPER_URL

const directpayinitialFormData = Object.freeze({
    workspace_type: "Direct Pay",
    poc_email: "accounts@" + process.env.REACT_APP_OCC_EMAIL_DOMAIN,
    confirm_poc_email: "accounts@" + process.env.REACT_APP_OCC_EMAIL_DOMAIN,
    summary_and_justification: "",
    project_short_title: "",
    workspace_use: " ",
    approved_creditcard: false,
    project_role: " ",
    attestation: false,
});

const DirectPayForm = (props) => {

        const { updateRedirectHome } = props
	      const [formData, updateFormData] = useState(directpayinitialFormData);
        const [billingID, setBillingID] = useState('');
        const [email, setEmail] = useState('');
        const [requestApproved, setRequestApproved] = useState("");
        const [title, setTitle] = useState('');
        const [summary, setSummary] = useState('');
        const [workspace_use, setWorkspaceUse] = useState('');
        const [approved_creditcard, setCreditCard] = useState(false);
        const [projectRole, setProjectRole] = useState('');
        const [directpaylimit, setDirectPayLimit] = useState('');
        const [buttonDisabled, setButtonDisabled] = useState(false);
        const [buttonDisabledtoo, setButtonDisabledtoo] = useState(false);
        const [formDisabled, setformDisabled] = useState(false);

        let componentToRender;

        const handleSubmit = event => {
            event.preventDefault();

            var data = {
                "queryStringParameters": {
                    "method": "confirmBillingID",
                    "brh_data": {
                        "AGBillingID": billingID,
                        "Email": email
                    }
                }
            };

            var headers = {
                    'Content-Type': 'text/plain'
            }

            callExternalURL(occHelpURL, "post", headers, data, (response) => {
                if (response['statusCode'] !== 400 && response.body[0]["Message"]["statusCode"] === 200) {
                    setRequestApproved("true");
                    setDirectPayLimit(response.body[0]["Message"]["body"]);
                    setformDisabled(true);
                    setButtonDisabledtoo(true);
                } else {
                    console.log("handle error");
                    setRequestApproved("false");
                }
                updateRedirectHome(true);
            });
        }


        const handleChange = event => {

            if (event.target.name === 'project_short_title') {
                setTitle(event.target.value)
            }
            if (event.target.name === 'summary_and_justification') {
                setSummary(event.target.value)
            }
            if (event.target.name === 'workspace_use') {
                setWorkspaceUse(event.target.value)
            }
            if (event.target.name === 'approved_creditcard') {
                setCreditCard(event.target.checked)
            }
            if (event.target.name === 'project_role') {
                setProjectRole(event.target.value)
            }
            updateFormData({
                ...formData,
                [event.target.name]: (event.target.type === "checkbox") ? event.target.checked : event.target.value.trim()
            })
        }


        const handleRequest = event => {

            setButtonDisabled(true);
            event.preventDefault();

            var direct_pay_limit = `,"direct_pay_limit":` + directpaylimit + `}`
            var tempdata = JSON.stringify(formData)
            tempdata = tempdata.slice(0, tempdata.length - 1)
            var data = tempdata + direct_pay_limit;

            requestWorkspace(JSON.parse(data), (response) => {
                var reqid = (JSON.stringify(response.workspace_request_id));
                reqid = (reqid.slice(1, reqid.length - 1));
                requestAPICall(reqid);
                updateRedirectHome(true);
            });

        }

        const requestAPICall = (reqid) => {
            var data = {
                "queryStringParameters": {
                    "method": "handleRequest",
                    "brh_data": {
                        "AGBillingID": billingID,
                        "Email": email,
                        "ProjectTitle": title,
                        "ProjectSummary": summary,
                        "WorkspaceUse": workspace_use,
                        "ApprovedCreditCard": approved_creditcard,
                        "ProjectRole": projectRole,
                        "RequestUUID": reqid
                    }
                }
            };

            var headers = {
                    'Content-Type': 'text/plain'
            };

            callExternalURL(occHelpURL, "post", headers, data, (response) => {
                console.log(JSON.stringify(response));
            });

            window.location = '/';
        }


        if(requestApproved === "true"){
          componentToRender = (
          <div>
                <Form onSubmit={handleRequest} keyField='directpay_request_information'>
                  <Form.Row className="mb-3">
                  <Col>
                  <Form.Check type="checkbox" name="attestation" id="occ_invoice" label={`By filling out this form below, I consent to be invoiced by OCC the amount of $${(directpaylimit)} to provision that amount of compute for my workspace. If this value is incorrect, please contact OCC (<a href="mailto:billing@occ-data.org">billing@occ-data.org</a>) to update your request amount.`} required />
                  </Col>
                  </Form.Row>
                  <br></br>
                  <Form.Label> Project Brief Title? <span data-tip data-for="project_short_title"><BiHelpCircle /></span></Form.Label>
                  <ReactTooltip class="tooltip" id="project_short_title" place="top" effect="solid" multiline={true}>
                    Please enter a brief title for your project
                  </ReactTooltip>
                  <Form.Control type="text" name="project_short_title" onChange={handleChange} placeholder="Enter Project Brief Title" required/>
                  <br></br>
                  <Form.Label> Brief Project Summary and Justification? <span data-tip data-for="summary_and_justification"><BiHelpCircle /></span></Form.Label>
                  <ReactTooltip class="tooltip" id="summary_and_justification" place="top" effect="solid" multiline={true}>
                    Please enter a brief summary and justification for your project.
                  </ReactTooltip>
                  <Form.Control type="text" name="summary_and_justification" onChange={handleChange} placeholder="Enter Brief Summary and Justification" required/>
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
                  <Form.Check type="checkbox" name="approved_creditcard" onChange={handleChange} label={`By selecting this check box, we will be issuing you a invoice that must be paid through credit card`}/>
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
                  Cannot confirm BillingID. Please correct the BillingID number you entered and/or the email characters and try again, or contact OCC at ag@occ-data.org
              </Alert>
            </div>
          )
        }

        return(
            <div>
              <Form onSubmit={handleSubmit} keyField='directpay_billingID_confirmation'>
                      <Form.Label> BillingID <span data-tip data-for="billingID_help"><BiHelpCircle /></span></Form.Label>
                      <ReactTooltip class="tooltip" id="billingID_help" place="top" effect="solid" multiline={true}>
                        Enter the Billing ID provided from registration through the Payment Solutions Portal. <br />
                        If you have not recieved a BillingID, please complete registration at: <a href="https://payments.occ-data.org/">https://payments.occ-data.org/</a>
                      </ReactTooltip>
                      <Form.Control type="text" name="billingID" disabled={formDisabled} onChange={event => setBillingID(event.target.value)} placeholder="Enter BillingID" />
                      <br></br>
                      <Form.Label> First 3 Characters of Associated Email Address <span data-tip data-for="email_help"><BiHelpCircle /></span></Form.Label>
                      <ReactTooltip class="tooltip" id="email_help" place="top" effect="solid" multiline={true}>
                        Enter the first three characters of the email associated with your OCC BillingID. Ex: Email address JohnDoe@gmail.com should enter Joh in the box
                      </ReactTooltip>
                      <Form.Control type="text" name="email" disabled={formDisabled} onChange={event => setEmail(event.target.value)} placeholder="Enter First Three Characters of Email" />
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
