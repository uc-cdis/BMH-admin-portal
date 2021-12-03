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

const FORM_OPTIONS = {
  none: "",
  stridesGrant: "strides-grant",
  stridesCredits: "strides-credits"
}
const DEFAULT_FORM = FORM_OPTIONS.stridesCredits

const RequestWorkspace = () => {
  const [formToggle, setFormToggle] = useState(DEFAULT_FORM)
  const [redirectHome, setRedirectHome] = useState(false)
  const [creditsAuthorized, setCreditsAuthorized] = useState(false)
  const [grantsAuthorized, setGrantsAuthorized] = useState(false)

  useEffect(() => {
    async function fetchAuthorized() {
      const cAuthorized = await authorizeCredits();
      const gAuthorized = await authorizeGrants();
      setCreditsAuthorized(cAuthorized);
      setGrantsAuthorized(gAuthorized);
    }
    fetchAuthorized();
  }, [])

  const handleChange = (val) => {
    setFormToggle(val)
  }

  if (redirectHome) {
    return <Redirect to="/" />
  }

  let componentToRender
  if (formToggle === FORM_OPTIONS.stridesGrant) {
    if (grantsAuthorized) {
      componentToRender = (<div>
        <Row className="mb-3"><p>{"If you have received NIH funding (e.g. a grant, contract, cooperative agreement, or other transaction agreement) and intend to use these funds for your BRH account, please complete the form below. Please note that by choosing this option, your organization will be responsible for payment and therefore will need to provide Four Points Technology with a Purchase Order."}</p></Row>
        <Row className="mb-3"><h4>{"Request Form for STRIDES Grant/Award Funded Account"}</h4></Row>
        <Row className="justify-content-left">
          <Col>
            <StridesGrantForm updateRedirectHome={setRedirectHome} />
          </Col>
        </Row>
      </div>)
    }
    else {
      componentToRender = <Row className="mb-3"><h4>{"You don't have access to the Request Form for STRIDES Grant/Award funded account"}</h4></Row>
    }
  } else if (formToggle === FORM_OPTIONS.stridesCredits) {
    if (creditsAuthorized) {
      componentToRender = (<div>
        <Row className="mb-3"><p>{"If you are requesting credits from the NIH STRIDES Initiative for your BRH account, please complete the form below. If your request is approved, then a new account with a spending limit will be provisioned for usage."}</p></Row>
        <Row className="mb-3"><h4>{"Request Form for STRIDES Credits Account"}</h4></Row>
        <Row className="justify-content-left">
          <Col>
            <StridesCreditForm updateRedirectHome={setRedirectHome} />
          </Col>
        </Row>
      </div>)
    }
    else {
      componentToRender = <Row className="mb-3"><h4>{"You don't have access to the Request Form for STRIDES Credits funded account"}</h4></Row>
    }
  }

  return (
    <Container>
      {(creditsAuthorized || grantsAuthorized) ?
        (<div>
          <Row className="justify-content-md-center my-5">
            <h2>Workspace Account Request Form</h2>
            <p className="lead">The form below is used to request a newly provisioned Gen3 Workspace Account.</p>
          </Row>
          <div>
            <Row className="mb-5">
              <ToggleButtonGroup type="radio" name="form-select" defaultValue={formToggle} onChange={handleChange}>
                <ToggleButton variant="outline-primary" value={FORM_OPTIONS.stridesGrant}>STRIDES Grant/Award Funded</ToggleButton>
                <ToggleButton variant="outline-primary" value={FORM_OPTIONS.stridesCredits}>STRIDES Credits</ToggleButton>
              </ToggleButtonGroup>
            </Row>
          </div>
          {componentToRender}
        </div>
        )
        : (<Row className="justify-content-md-center my-5">
          <h2>You don't have access to the Workspace Account Request Form</h2>
        </Row>)}
      <footer className="my-5 pt-5 text-muted text-center text-small">
        <p className="mb-1">&copy; 2021 Biomedical Hub</p>
      </footer>
    </Container>
  )
}

export default RequestWorkspace;
