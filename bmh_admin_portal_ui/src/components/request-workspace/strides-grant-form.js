import React, { useState, useRef } from 'react';
import { BiHelpCircle } from 'react-icons/bi';
import ReactTooltip from 'react-tooltip';

/* Bootstrap Imports */
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

import { requestWorkspace } from '../../util/api';

const NIH_GRANT_NUMBER_REGEX = /^([0-9]{1})([A-Z0-9]{3})([A-Z]{2}[0-9]{6})-([A-Z0-9]{2}$|[A-Z0-9]{4}$)/gm

const initialFormData = Object.freeze({
  workspace_type: "STRIDES Grant",
  scientific_poc: "",
  poc_email: "accounts@" + process.env.REACT_APP_ROOT_EMAIL_DOMAIN,
  confirm_poc_email: "accounts@" + process.env.REACT_APP_ROOT_EMAIL_DOMAIN,
  scientific_institution_domain_name: "",
  nih_funded_award_number: "",
  administering_nih_institute: "",
  program_officer_approval: "No",
  nih_program_official_name: "",
  nih_program_official_email: "",
  keywords: "",
  ecs: true,
  summary_and_justification: "",
  project_short_title: "",
  rcdc: "",
  additional_poc_email: "",
  additional_poc_job_title: "",
  attestation: false
})

const StridesGrantForm = (props) => {
  const { updateRedirectHome } = props

  const [formData, updateFormData] = useState(initialFormData)
  const [buttonDisabled, setButtonDisabled] = useState(false)
  const [validated, setValidated] = useState(false)

  const pocConfirmEmailInputEl = useRef(null);

  const handleChange = (e) => {
    // validate email and confirm email
    if (e.target.name === "confirm_internal_poc_email") {
      if (e.target.value.trim() !== formData['internal_poc_email']) {
        e.target.setCustomValidity("Must match email")
      } else {
        e.target.setCustomValidity("")
      }
    }

    if (pocConfirmEmailInputEl.current) {
      if (e.target.name === "internal_poc_email" && e.target.value.trim() !== formData['confirm_internal_poc_email']) {
        pocConfirmEmailInputEl.current.setCustomValidity("Must match email")
      } else {
        pocConfirmEmailInputEl.current.setCustomValidity("")
      }
    }

    // validate NIH IoC
    if (e.target.name === "administering_nih_institute") {
      if (e.target.value.trim() === "") {
        e.target.setCustomValidity("Must select NIH IoC")
      } else {
        e.target.setCustomValidity("")
      }
    }

    // validate NIH grant number
    if (e.target.name === "nih_funded_award_number") {
      const inputNIHGrantNumber = e.target.value.trim()
      if (inputNIHGrantNumber && inputNIHGrantNumber.match(NIH_GRANT_NUMBER_REGEX)) {
        e.target.setCustomValidity("")
      } else {
        e.target.setCustomValidity("Must match NIH grant number format")
      }
    }

    updateFormData({
      ...formData,
      [e.target.name]: (e.target.type === "checkbox") ? e.target.checked : e.target.value.trim()
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const form = e.currentTarget;
    if (form.checkValidity()) {
      setButtonDisabled(true)
      requestWorkspace(formData, () => {
        updateRedirectHome(true)
      })
    }

    setValidated(true);
  }

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit}>
      <Form.Row className="mb-3">
        <Col>
          <Form.Label>Scientific POC Name <span data-tip data-for="scientific_poc_help"><BiHelpCircle /></span></Form.Label>
          <ReactTooltip class="tooltip" id="scientific_poc_help" place="top" effect="solid" multiline={true}>
            Principal Investigator or other awardee who has overall responsibility for scientific direction, <br />
            responsible for setting (or delegating) security policies and financial oversight of cloud resources
          </ReactTooltip>
          <Form.Control required onChange={handleChange} type="text" name="scientific_poc" placeholder="Jane Smith" />
        </Col>
        <Col>
          <Form.Label>Scientific Institution Domain Name<span data-tip data-for="scientific_institution_domain_name_help"><BiHelpCircle /></span></Form.Label>
          <ReactTooltip class="tooltip" id="scientific_institution_domain_name_help" place="top" effect="solid" multiline={true}>
            Examples: hms.harvard.edu, nih.gov, uchicago.edu, etc.
          </ReactTooltip>
          <Form.Control required type="text" onChange={handleChange} name="scientific_institution_domain_name" placeholder="Domain Name of University or Institution" />
        </Col>
      </Form.Row>

      <Form.Row className="mb-3">
        <Col>
          <Form.Label>Scientific POC Email <span data-tip data-for="internal_poc_email"><BiHelpCircle /></span></Form.Label>
          <ReactTooltip class="tooltip" id="internal_poc_email" place="top" effect="solid" multiline={true}>
            Email address used for contact regarding the workspace.
          </ReactTooltip>
          <Form.Control
            type="email" onChange={handleChange}
            name="internal_poc_email" placeholder="user@email.org"
            required
          />

          <Form.Control.Feedback type="invalid">
            Must be a valid email
          </Form.Control.Feedback>
        </Col>
        <Col>
          <Form.Label>Confirm Scientific POC Email <span data-tip data-for="confirm_internal_poc_email"><BiHelpCircle /></span></Form.Label>
          <ReactTooltip class="tooltip" id="confirm_internal_poc_email" place="top" effect="solid" multiline={true}>
            Email address used for contact regarding the workspace.
          </ReactTooltip>
          <Form.Control required type="email" onChange={handleChange} name="confirm_internal_poc_email" placeholder="user@email.org"
            feedback="Value must match Scientific POC Email" ref={pocConfirmEmailInputEl}
          />

          <Form.Control.Feedback type="invalid">
            Must be a valid email and match "Scientific POC Email"
          </Form.Control.Feedback>
        </Col>
      </Form.Row>

      <Form.Row className="mb-3">
        <Col>
          <Form.Label>NIH Funded Project Award/Grant Number <span data-tip data-for="nih_funded_award_number_help"><BiHelpCircle /></span></Form.Label>
          <ReactTooltip class="tooltip" id="nih_funded_award_number_help" place="top" effect="solid" multiline={true}>
            Derived from NIH Notice of Award, uniquely identifies NIH-funded research projects
          </ReactTooltip>
          <Form.Control type="text" onChange={handleChange} name="nih_funded_award_number" placeholder="1A23BC012345-01 or 1A23BC012345-01D6" required />
          <Form.Control.Feedback type="invalid">
            Must be a valid NIH Award/Grant number (format mismatch)
          </Form.Control.Feedback>
        </Col>
        <Col>
          <Form.Label>Administering NIH Institute or Center <span data-tip data-for="administering_nih_institute_help"><BiHelpCircle /></span></Form.Label>
          <ReactTooltip class="tooltip" id="administering_nih_institute_help" place="top" effect="solid" multiline={true}>
            Derived from Notice of Award
          </ReactTooltip>
          <Form.Control as="select" onChange={handleChange} name="administering_nih_institute" custom required >
            <option>{""}</option>
            <option>CC - NIH Clinical Center</option>
            <option>CIT - Center for Information Technology</option>
            <option>CSR - Center for Scientific Review</option>
            <option>FIC - Fogarty International Center</option>
            <option>NCATS - National Center for Advancing Translational Sciences</option>
            <option>NCCIH - National Center for Complementary and Integrative Health</option>
            <option>NCI - National Cancer Institute</option>
            <option>NEI - National Eye Institute</option>
            <option>NHGRI - National Human Genome Research Institute</option>
            <option>NHLBI - National Heart, Lung, and Blood Institute</option>
            <option>NIA - National Institute on Aging</option>
            <option>NIAAA - National Institute on Alcohol Abuse and Alcoholism</option>
            <option>NIAID - National Institute of Allergy and Infectious Diseases</option>
            <option>NIAMS - National Institute of Arthritis and Musculoskeletal and Skin Diseases</option>
            <option>NIBIB - National Institute of Biomedical Imaging and Bioengineering</option>
            <option>NICHD - National Institute of Child Health and Human Development</option>
            <option>NIDA - National Institute on Drug Abuse</option>
            <option>NIDCD - National Institute on Deafness and Other Communication Disorders</option>
            <option>NIDCR - National Institute of Dental and Craniofacial Research</option>
            <option>NIDDK - National Institute of Diabetes and Digestive and Kidney Diseases</option>
            <option>NIEHS - National Institute of Environmental Health Sciences</option>
            <option>NIGMS - National Institute of General Medical Sciences</option>
            <option>NIMH - National Institute of Mental Health</option>
            <option>NIMHD - National Institute on Minority Health and Health Disparities</option>
            <option>NINDS - National Institute of Neurological Disorders and Stroke</option>
            <option>NINR - National Institute of Nursing Research</option>
            <option>NLM - National Library of Medicine</option>
            <option>OD - NIH Office of the Director</option>
          </Form.Control>
          <Form.Control.Feedback type="invalid">
            Please select a valid NIH Institute or Center
          </Form.Control.Feedback>
        </Col>
      </Form.Row>

      <Form.Row className="mb-3">
        <Col>
          <Form.Label>Do you have Program Officer Approval?</Form.Label>
          <Form.Control as="select" onChange={handleChange} name="program_officer_approval" custom>
            <option>No</option>
            <option>Yes</option>
          </Form.Control>
        </Col>
      </Form.Row>
      <Form.Row className="mb-3">
        <Col>
          <Form.Label>NIH Program Official Name <span data-tip data-for="nih_program_official_name"><BiHelpCircle /></span></Form.Label>
          <ReactTooltip class="tooltip" id="nih_program_official_name" place="top" effect="solid" multiline={true}>
            Derived from Notice of Award
          </ReactTooltip>
          <Form.Control type="text" onChange={handleChange} name="nih_program_official_name" placeholder="John Doe" />
        </Col>
        <Col>
          <Form.Label>NIH Program Official Email<span data-tip data-for="nih_program_official_email"><BiHelpCircle /></span></Form.Label>
          <ReactTooltip class="tooltip" id="nih_program_official_email" place="top" effect="solid" multiline={true}>
            Derived from Notice of Award
          </ReactTooltip>
          <Form.Control type="text" onChange={handleChange} name="nih_program_official_email" placeholder="jdoe@nih.gov" />
        </Col>
      </Form.Row>
      <Form.Row className="mb-3">
        <Col>
          <Form.Label>Keywords<span data-tip data-for="keywords"><BiHelpCircle /></span></Form.Label>
          <ReactTooltip class="tooltip" id="keywords" place="top" effect="solid" multiline={true}>
            List of terms describing scientific area(s), technologies, and/or conditions relevant to research project
          </ReactTooltip>
          <Form.Control required type="text" onChange={handleChange} name="keywords" />
        </Col>
      </Form.Row>
      <Form.Row className="mb-3">
        <Col>
          <Form.Label>Project Summary and Justification<span data-tip data-for="summary_and_justification"><BiHelpCircle /></span></Form.Label>
          <ReactTooltip class="tooltip" id="summary_and_justification" place="top" effect="solid" multiline={true}>
            Brief description of the research problem clearly identifying the direct relevance of the project to biomedical research
          </ReactTooltip>
          <Form.Control required type="text" onChange={handleChange} name="summary_and_justification" />
        </Col>
      </Form.Row>
      <Form.Row className="mb-3">
        <Col>
          <Form.Label>Project Short Title<span data-tip data-for="project_short_title"><BiHelpCircle /></span></Form.Label>
          <ReactTooltip class="tooltip" id="project_short_title" place="top" effect="solid" multiline={true}>
            A short title of the project (maximum 16 characters)
          </ReactTooltip>
          <Form.Control required type="text" onChange={handleChange} name="project_short_title" placeholder="Project Title" maxLength="16" />
        </Col>
        <Col>
          <Form.Label>Research, Condition, and Disease Categorization (<a href="https://report.nih.gov/categorical_spending.aspx" target="_blank" rel="noreferrer">Detailed List</a>)</Form.Label>
          <ReactTooltip class="tooltip" id="rcdc" place="top" effect="solid" multiline={true}>
            See https://report.nih.gov/categorical_spending.aspx for detailed list
          </ReactTooltip>
          <Form.Control required type="text" onChange={handleChange} name="rcdc" />
        </Col>
      </Form.Row>

      <Form.Row className="mb-3">
        <Col>
          <Form.Label>Technical or Additional POC Email</Form.Label>
          <Form.Control type="text" onChange={handleChange} name="additional_poc_email" placeholder="additional_poc@email.com" />
        </Col>
        <Col>
          <Form.Label>Job Title of Additional POC<span data-tip data-for="additional_poc_job_title"><BiHelpCircle /></span></Form.Label>
          <ReactTooltip class="tooltip" id="additional_poc_job_title" place="top" effect="solid" multiline={true}>
            Job title or affiliation with the research program
          </ReactTooltip>
          <Form.Control type="text" onChange={handleChange} name="additional_poc_job_title" placeholder="Job Title" />
        </Col>
      </Form.Row>

      <Form.Row className="mb-3">
        <Col>
          <Form.Check type="checkbox" name="attestation" label="I acknowledge to submit this form" required />
        </Col>
      </Form.Row>

      <Form.Row className="mt-4">
        <Col xs={4}></Col>
        <Col xs={4}>
          <Button className="btn btn-primary btn-lg btn-block mb-6"
            type="submit"
            id="request-form-submit-button"
            disabled={buttonDisabled}>
            Submit Request</Button>
        </Col>
        <Col xs={4}></Col>
      </Form.Row>
    </Form>
  )
}

export default StridesGrantForm;
