import React, { useState } from 'react';
import { BiHelpCircle } from 'react-icons/bi';
import ReactTooltip from 'react-tooltip';

/* Bootstrap Imports */
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

import { requestWorkspace } from '../../util/api';

const initialFormData = Object.freeze({
    workspace_type: "STRIDES Grant",
	scientific_poc: "",
    poc_email: "",
    confirm_poc_email: "",
	scientific_institution: "",
	nih_funded_award_number: "",
	administering_nih_institute: "",
    program_officer_approval: "No",
    nih_program_official_name: "",
    nih_program_official_email: "",
    keywords: "",
    summary_and_justification: "",
    short_title: "",
    rcdc: "",
    additional_poc_email: "",
    additional_poc_job_title: ""

})

const StridesGrantForm = (props) => {
    const { updateRedirectHome } = props

    const [formData, updateFormData] = useState(initialFormData)
    const [buttonDisabled, setButtonDisabled] = useState(false)
    const [validated, setValidated] = useState(false)

	const handleChange = (e) => {

        if( e.target.name === "confirm_poc_email" ) {
            if( e.target.value.trim() !== formData['poc_email'] ) {
                e.target.setCustomValidity("Must match email")
            } else {
                e.target.setCustomValidity("")
            }
        }

		updateFormData({
			...formData,
			[e.target.name]: e.target.value.trim()
		})
	}

	const handleSubmit = (e) => {
		e.preventDefault()

        const form = e.currentTarget;
        if ( form.checkValidity() ) {
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
                    <Form.Label>Scientific Institution <span data-tip data-for="scientific_institution_help"><BiHelpCircle /></span></Form.Label>
                    <ReactTooltip class="tooltip" id="scientific_institution_help" place="top" effect="solid" multiline={true}>
                        Examples: Harvard Medical School, Mayo Clinic, University of Chicago, etc.
                    </ReactTooltip>
                    <Form.Control required type="text" onChange={handleChange} name="scientific_institution" placeholder="University or Institution" />
                </Col>
            </Form.Row>

            <Form.Row className="mb-3">
                <Col>
                    <Form.Label>Scientific POC Email <span data-tip data-for="poc_email"><BiHelpCircle /></span></Form.Label>
                    <ReactTooltip class="tooltip" id="poc_email" place="top" effect="solid" multiline={true}>
                        Email address used for contact regarding the Workspace.
                    </ReactTooltip>
                    <Form.Control
                        type="email" onChange={handleChange}
                        name="poc_email" placeholder="user@email.org"
                        required
                    />

                    <Form.Control.Feedback type="invalid">
                        Must be a valid email
                    </Form.Control.Feedback>
                </Col>
                <Col>
                    <Form.Label>Confirm Scientific POC Email <span data-tip data-for="confirm_poc_email"><BiHelpCircle /></span></Form.Label>
                    <ReactTooltip class="tooltip" id="confirm_poc_email" place="top" effect="solid" multiline={true}>
                        Email address used for contact regarding the Workspace.
                    </ReactTooltip>
                    <Form.Control required type="email" onChange={handleChange} name="confirm_poc_email" placeholder="user@email.org"
                       feedback="Value must match Scientific POC Email"
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
                    <Form.Control type="text" onChange={handleChange} name="nih_funded_award_number" placeholder="123456789" required />
                </Col>
                <Col>
                    <Form.Label>Administering NIH Institute or Center <span data-tip data-for="administering_nih_institute_help"><BiHelpCircle /></span></Form.Label>
                    <ReactTooltip class="tooltip" id="administering_nih_institute_help" place="top" effect="solid" multiline={true}>
                        Derived from Notice of Award
                    </ReactTooltip>
                    <Form.Control type="text" onChange={handleChange} name="administering_nih_institute" placeholder="NIH" />
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
                    <Form.Control type="text" onChange={handleChange} name="keywords" />
                </Col>
            </Form.Row>
            <Form.Row className="mb-3">
                <Col>
                    <Form.Label>Summary and Justification<span data-tip data-for="summary_and_justification"><BiHelpCircle /></span></Form.Label>
                    <ReactTooltip class="tooltip" id="summary_and_justification" place="top" effect="solid" multiline={true}>
                        Brief description of the research problem clearly identifying the direct relevance of the project to biomedical research
                    </ReactTooltip>
                    <Form.Control type="text" onChange={handleChange} name="summary_and_justification" />
                </Col>
            </Form.Row>
            <Form.Row className="mb-3">
                <Col>
                    <Form.Label>Short Title of the Project</Form.Label>
                    <Form.Control type="text" onChange={handleChange} name="short_title" placeholder="Project Title" />
                </Col>
                <Col>
                    <Form.Label>Research, Condition, and Disease Categorization (<a href="https://report.nih.gov/categorical_spending.aspx" target="_blank" rel="noreferrer">Detailed List</a>)</Form.Label>
                    <ReactTooltip class="tooltip" id="rcdc" place="top" effect="solid" multiline={true}>
                        See https://report.nih.gov/categorical_spending.aspx for detailed list
                    </ReactTooltip>
                    <Form.Control type="text" onChange={handleChange} name="rcdc" />
                </Col>
            </Form.Row>

            <Form.Row className="mb-3">
                <Col>
                    <Form.Label>Technical or Additional POC Email</Form.Label>
                    <Form.Control type="text" onChange={handleChange} name="additional_poc_email" placeholder="additional_poc@email.com"/>
                </Col>
                <Col>
                    <Form.Label>Job Title of Additional POC<span data-tip data-for="additional_poc_job_title"><BiHelpCircle /></span></Form.Label>
                    <ReactTooltip class="tooltip" id="additional_poc_job_title" place="top" effect="solid" multiline={true}>
                        Job title or affiliation with the research program
                    </ReactTooltip>
                    <Form.Control type="text" onChange={handleChange} name="additional_poc_job_title" placeholder="Job Title" />
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
