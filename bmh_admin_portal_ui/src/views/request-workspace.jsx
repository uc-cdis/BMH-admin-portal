// © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
// 
// This AWS Content is provided subject to the terms of the AWS Customer Agreement
// available at http://aws.amazon.com/agreement or other written agreement between
// Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';

import StridesGrantForm  from '../components/request-workspace/strides-grant-form';
import StridesCreditForm from '../components/request-workspace/strides-credits-form';
import { authorizeCredits } from '../util/auth';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';

const defaultForm = "strides-grant"

const RequestWorkspace = () => {
    const [formToggle, setFormToggle] = useState(defaultForm)
	const [redirectHome, setRedirectHome] = useState(false)
    const [creditsAuthorized, setCreditsAuthorized] = useState(false)

    useEffect(() => {
        async function fetchAuthorized() {
            const authorized = await authorizeCredits();
            console.log("Authorized: " + authorized);
            if( authorized ) {
                setCreditsAuthorized(true);
            } else {
                setCreditsAuthorized(false);
            }
        }
        fetchAuthorized();
    })

    const handleChange = (val) => {
        setFormToggle(val)
    }

    if( redirectHome ) {
        return <Redirect to="/" />
    }

    let formToRender = ""
    if( formToggle === "strides-grant" ) {
        formToRender = (<StridesGrantForm updateRedirectHome={setRedirectHome} />)
    } else if( formToggle === "strides-credit" ) {
        formToRender = (<StridesCreditForm updateRedirectHome={setRedirectHome} />)
    }

	return (
        <Container>
            <Row className="justify-content-md-center my-5">
                <h2>Workspace Account Request Form</h2>
                <p className="lead">The form below is used to request a newly provisioned Gen3 Workspace Account.</p>
            </Row>

            { creditsAuthorized && (
                <Row className="mb-5">
                    <ToggleButtonGroup type="radio" name="form-select" defaultValue={defaultForm} onChange={handleChange}>
                        <ToggleButton value="strides-grant">STRIDES Grant/Award Funded</ToggleButton>
                        <ToggleButton value="strides-credit">STRIDES Credits</ToggleButton>
                    </ToggleButtonGroup>
                </Row>
            )}
				
            <Row className="mb-3"><h4>Request Details</h4></Row>
            <Row className="justify-content-left"><Col>
                {formToRender}
            </Col></Row>

			<footer className="my-5 pt-5 text-muted text-center text-small">
			  <p className="mb-1">&copy; 2021 Biomedical Hub</p>
			</footer>
      </Container>
	)
}

export default RequestWorkspace;
