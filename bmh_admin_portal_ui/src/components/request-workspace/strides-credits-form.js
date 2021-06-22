import React, { useState } from 'react';
import { BiHelpCircle } from 'react-icons/bi';
import ReactTooltip from 'react-tooltip';

/* Bootstrap Imports */
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

import { requestWorkspace } from '../../util/api';

const initialFormData = Object.freeze({
    workspace_type: "STRIDES Credits",
	scientific_poc: "",
	scientific_institution: "",
	nih_funded_award_number: ""
})

const StridesCreditForm = (props) => {
    const { updateRedirectHome } = props
    const [formData, updateFormData] = useState(initialFormData)
    const [buttonDisabled, setButtonDisabled] = useState(false)

	const handleChange = (e) => {
		updateFormData({
			...formData,
			[e.target.name]: e.target.value.trim()
		})
	}

	const handleSubmit = (e) => {
		e.preventDefault()
        setButtonDisabled(true)
		requestWorkspace(formData, () => {
			updateRedirectHome(true)
		})
	}

    return (
        <Form onSubmit={handleSubmit}>
            <Form.Row className="mb-3">
                <Col>
                    <Form.Label>Scientific POC Name <span data-tip data-for="scientific_poc_help"><BiHelpCircle /></span></Form.Label>
                    <ReactTooltip class="tooltip" id="scientific_poc_help" place="top" effect="solid" multiline={true}>
                        Principal Investigator or other awardee who has overall responsibility for scientific direction, <br />
                        responsible for setting (or delegating) security policies and financial oversight of cloud resources
                    </ReactTooltip>
                    <Form.Control onChange={handleChange} type="text" name="scientific_poc" placeholder="Jane Smith" />
                </Col>
                <Col>
                    <Form.Label>Scientific Institution <span data-tip data-for="scientific_institution_help"><BiHelpCircle /></span></Form.Label>
                    <ReactTooltip class="tooltip" id="scientific_institution_help" place="top" effect="solid" multiline={true}>
                        Examples: Harvard Medical School, Mayo Clinic, University of Chicago, etc.
                    </ReactTooltip>
                    <Form.Control type="text" onChange={handleChange} name="scientific_institution" placeholder="University or Institution" />
                </Col>
            </Form.Row>

			<Form.Row className="mb-3">
                <Col>
                    <Form.Label>NIH Funded Project Award/Grant Number <span data-tip data-for="nih_funded_award_number_help"><BiHelpCircle /></span></Form.Label>
                    <ReactTooltip class="tooltip" id="nih_funded_award_number_help" place="top" effect="solid" multiline={true}>
                        Derived from NIH Notice of Award, uniquely identifies NIH-funded research projects
                    </ReactTooltip>
                    <Form.Control type="text" onChange={handleChange} name="nih_funded_award_number" placeholder="123456789" />
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

export default StridesCreditForm;