// © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
// 
// This AWS Content is provided subject to the terms of the AWS Customer Agreement
// available at http://aws.amazon.com/agreement or other written agreement between
// Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

import React, { useState } from 'react';
import { BiHelpCircle } from 'react-icons/bi';
import ReactTooltip from 'react-tooltip';
import { Redirect } from 'react-router-dom';

import { requestWorkspace } from '../util/api';

const initialFormData = Object.freeze({
	scientific_poc: "",
	scientific_institution: "",
	nih_funded_award_number: "",
	administering_nih_institute: ""
})

const RequestWorkspace = () => {
	const [formData, updateFormData] = useState(initialFormData)
	const [redirectHome, updateRedirectHome] = useState(false)

	const handleChange = (e) => {
		updateFormData({
			...formData,
			[e.target.name]: e.target.value.trim()
		})
	}

	const handleSubmit = (e) => {
		e.preventDefault()
		requestWorkspace(formData, () => {
			updateRedirectHome(true)
		})

	}

	if(redirectHome) {
		return <Redirect to="/" />
	}

	return (
		<div className="container text-left">
			<div className="py-5 text-center">
			  <h2>Workspace Account Request Form</h2>
			  <p className="lead">The form below is used to request a newly provisioned Gen3 Workspace Account.</p>
			</div>
				
			<div id="form-container">
			<h4 className="mb-3">Request Details</h4>
			
			<form onSubmit={handleSubmit} className="needs-validation" id="request-workspace-form" novalidate>
		
			  <div className="row">
				<div className="col-md-6 mb-3">
				  <label for="scientific_pos">Scientific POC Name <span data-tip data-for="scientific_poc_help"><BiHelpCircle /></span></label> 
				  <ReactTooltip class="tooltip" id="scientific_poc_help" place="top" effect="solid" multiline={true}>
					  Principal Investigator or other awardee who has overall responsibility for scientific direction, <br />
				  	responsible for setting (or delegating) security policies and financial oversight of cloud resources
				  </ReactTooltip>
				  <input onChange={handleChange} type="text" className="form-control" id="scientific_poc" name="scientific_poc" required />
				  <div className="invalid-feedback">
					Valid Scientific POC is required.
				  </div>
				</div>
				<div className="col-md-6 mb-3">
				  <label for="scientific_institution">Scientific Institution <span data-tip data-for="scientific_institution_help"><BiHelpCircle /></span></label>
				  <ReactTooltip class="tooltip" id="scientific_institution_help" place="top" effect="solid" multiline={true}>
				  	Examples: Harvard Medical School, Mayo Clinic, University of Chicago, etc.
				  </ReactTooltip>
				  <input onChange={handleChange} type="text" className="form-control" id="scientific_institution" name="scientific_institution" required />
				  <div className="invalid-feedback">
					Valid Scientific Institution is required.
				  </div>
				</div>
			  </div>
		
			  <div className="mb-3">
				<label for="nih_funded_award_number">NIH Funded Project Award/Grant # <span data-tip data-for="nih_funded_award_number_help"><BiHelpCircle /></span></label> 
				<ReactTooltip class="tooltip" id="nih_funded_award_number_help" place="top" effect="solid" multiline={true}>
					Derived from NIH Notice of Award, uniquely identifies NIH-funded research projects
				</ReactTooltip>
				<input onChange={handleChange} type="text" className="form-control" id="nih_funded_award_number" name="nih_funded_award_number" required />
				<div className="invalid-feedback">
				  Please enter a valid NIH Funded Project Award/Grant #.
				</div>
			  </div>
		
			  <div className="mb-3">
				<label for="administering_nih_institute">Administering NIH Institute or Center <span data-tip data-for="administering_nih_institute_help"><BiHelpCircle /></span></label> 
				<ReactTooltip class="tooltip" id="administering_nih_institute_help" place="top" effect="solid" multiline={true}>
					Derived from Notice of Award
				</ReactTooltip>
				
				<input onChange={handleChange} type="text" className="form-control" id="administering_nih_institute" name="administering_nih_institute" required />
				<div className="invalid-feedback">
					Administering NIH Institute
				</div>
			  </div>
		
		
			  <hr className="mb-4"></hr>
			  <button className="btn btn-primary btn-lg btn-block mb-6" type="submit" id="request-form-submit-button">Submit Request</button>
			</form>
			</div>
		
			<footer className="my-5 pt-5 text-muted text-center text-small">
			  <p className="mb-1">&copy; 2021 Biomedical Hub</p>
			</footer>
	  </div>
	)
}

export default RequestWorkspace;
