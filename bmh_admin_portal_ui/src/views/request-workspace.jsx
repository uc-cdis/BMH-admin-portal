// © 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
//
// This AWS Content is provided subject to the terms of the AWS Customer Agreement
// available at http://aws.amazon.com/agreement or other written agreement between
// Customer and either Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.

import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';

import StridesGrantForm from '../components/request-workspace/strides-grant-form';
import StridesCreditForm from '../components/request-workspace/strides-credits-form';
import { authorizeCredits, authorizeGrants } from '../util/auth';

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
    const [grantsAuthorized, setGrantsAuthorized] = useState(false)

    useEffect(() => {
        async function fetchAuthorized() {
            const authorized = await authorizeCredits();
            if( authorized ) {
                setCreditsAuthorized(true);
            } else {
                setCreditsAuthorized(false);
            }

            const gAuthorized = await authorizeGrants();
            if( gAuthorized ) {
                setGrantsAuthorized(true);
            } else {
                setGrantsAuthorized(false);
            }
        }
        fetchAuthorized();
    })

    const handleChange = (val) => {
        setFormToggle(val)
    }

    if (redirectHome) {
        return <Redirect to="/" />
    }

    let formToRender = ""
    let introToRender = ""
    if (grantsAuthorized && formToggle === 'strides-grant') {
        formToRender = (<StridesGrantForm updateRedirectHome={setRedirectHome} />)
        introToRender = "If you have received NIH funding (e.g. a grant, contract, cooperative agreement, or other transaction agreement) and intend to use these funds for your BRH account, please complete the form below. Please note that by choosing this option, your organization will be responsible for payment and therefore will need to provide Four Points Technology with a Purchase Order."
    } else if (creditsAuthorized) {
        formToRender = (<StridesCreditForm updateRedirectHome={setRedirectHome} />)
        introToRender = "If you are requesting credits from the NIH STRIDES Initiative for your BRH account, please complete the form below. If your request is approved, then a new account with a spending limit of $XXX will be provisioned for usage."
    }

    return (
        <Container>
            <Row className="justify-content-md-center my-5">
                <h2>Workspace Account Request Form</h2>
                <p className="lead">The form below is used to request a newly provisioned Gen3 Workspace Account.</p>
            </Row>

            {creditsAuthorized && grantsAuthorized && (
                <Row className="mb-5">
                    <ToggleButtonGroup type="radio" name="form-select" defaultValue={defaultForm} onChange={handleChange}>
                        <ToggleButton value="strides-grant">STRIDES Grant/Award Funded</ToggleButton>
                        <ToggleButton value="strides-credit">STRIDES Credits</ToggleButton>
                    </ToggleButtonGroup>
                </Row>
            )}

            <Row className="mb-3"><p>{introToRender}</p></Row>
            <Row className="mb-3"><h4>Request Details</h4></Row>
            <Row className="justify-content-left">
                <Col>
                    {formToRender}
                </Col>
            </Row>

            <footer className="my-5 pt-5 text-muted text-center text-small">
                <p className="mb-1">&copy; 2021 Biomedical Hub</p>
            </footer>
        </Container>
    )
}

export default RequestWorkspace;
