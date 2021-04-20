import React, { Component } from 'react';
import axios from 'axios';

class RequestWorkspace extends Component {
	state = {
		form: {
			firstName: '',
			lastName: '',
			email: '',
			organization: ''
		}
	}

	handleSubmit = e => {
		e.preventDefault();

		console.log('firing')
		console.log(this.state.form)
		
		// //This code is for future use, once JWT has been implemented.
		// console.log('accessing token');
		// const token = window.localStorage.getItem('token');

		// const api = `${process.env.REACT_APP_API_GW_ENDPOINT}/workspaces`
		// const headers = {
		// 	'Content-Type': 'application/json',
		// 	'X-Api-Key': `${process.env.REACT_APP_API_KEY}`
		// }

		// axios.post(api, {
		// 		firstName: this.state.form.firstName,
		// 		lastName: this.state.form.lastName,
		// 		email: this.state.form.email,
		// 		organization: this.state.form.organization
		// 	}, { headers: headers })
		// 	.then((response) => {
		// 		console.log(response);
		// 		console.log('submitted')
		// 	}, (error) => {
		// 		console.log(error);
		// 	});
	}

	handleChange = e => {
		const form = {...this.state.form};
		form[e.target.name] = e.target.value;
		this.setState({ form });
	}

	render() {
			return (
			<div className="container text-left">
			    <div className="py-5 text-center">
			      <h2>Workspace Account Request Form</h2>
			      <p className="lead">The form below is used to request a newly provisioned Gen3 Workspace Account.</p>
			    </div>
			
			    {/*<div id="response-alert" className="alert" role="alert" 
			      style={{"display:none;position: absolute; top:25; left:50%; transform: translate(-50%,-50%)"}}>
			    <div id="response-alert" className="alert" role="alert">   
			     <p>This should be hidden and then shown</p>
			    </div>*/}
			
			    <div id="form-container">
			    <h4 className="mb-3">Request Details</h4>
			    
			    <form onSubmit={this.handleSubmit} className="needs-validation" id="request-workspace-form" novalidate>
			
			      <div className="row">
			        <div className="col-md-6 mb-3">
			          <label for="firstName">First name</label>
			          <input onChange={this.handleChange} type="text" className="form-control" id="firstName" name="firstName" value={this.state.form.firstName} required />
			          <div className="invalid-feedback">
			            Valid first name is required.
			          </div>
			        </div>
			        <div className="col-md-6 mb-3">
			          <label for="lastName">Last name</label>
			          <input onChange={this.handleChange} type="text" className="form-control" id="lastName" name="lastName" value={this.state.form.lastName} required />
			          <div className="invalid-feedback">
			            Valid last name is required.
			          </div>
			        </div>
			      </div>
			
			      <div className="mb-3">
			        <label for="email">Email</label>
			        <input onChange={this.handleChange} type="email" className="form-control" id="email" name="email" value={this.state.form.email} required />
			        <div className="invalid-feedback">
			          Please enter a valid email address.
			        </div>
			      </div>
			
			      <div className="mb-3">
			        <label for="organization">Organization</label>
			        <input onChange={this.handleChange} type="text" className="form-control" id="organization" name="organization" value={this.state.form.organization} required />
			        <div className="invalid-feedback">
			          Please enter a valid Organization.
			        </div>
			      </div>
			
			      <hr className="mb-4"></hr>
			
			      <h4 className="mb-3">Billing Method</h4>
			
			      <div className="btn-group btn-group-toggle mb-4" data-toggle="buttons">
			        <label className="btn btn-primary active billing-method-radio" id="invoice">
			          <input type="radio" name="billing-method" value="invoice" id="invoice-selector" checked /> Invoice
			        </label>
			        <label className="btn btn-primary billing-method-radio" id="selfpay">
			          <input type="radio" name="billing-method" value="selfpay" id="selfpay-selector" /> Self-Pay
			        </label>
			        <label className="btn btn-primary billing-method-radio" id="strides">
			          <input type="radio" name="billing-method" value="strides" id="strides-selector" /> Strides
			        </label>
			      </div>
			
			      <div className="billing-method-subform" id="invoice-subform">
			
			        <h5>Payment Information</h5>
			        <div className="row">
			
			          <div className="col-md-6">
			
			            <div className="mb-3">
			              <label for="invoice-address1" className="form-label">Address</label>
			              <input type="text" className="form-control" name="invoice-address1" placeholder="1234 Main St" />
			            </div>
			
			            <div className="mb-3">
			              <label for="invoice-address2" className="form-label">Address 2 <span className="text-muted">(Optional)</span></label>
			              <input type="text" className="form-control" id="invoice-address2" placeholder="Apartment or suite" />
			            </div>
			
			            <div className="row">
			              <div className="col-md-5 mb-3">
			                <label for="invoice-country" className="form-label">Country</label>
			                <select className="form-select custom-select" name="invoice-country">
			                  <option value="">Choose...</option>
			                  <option>United States</option>
			                </select>
			              </div>
			
			              <div className="col-md-4 mb-3">
			                <label for="invoice-state" className="form-label">State</label>
			                <select className="form-select custom-select" name="invoice-state">
			                  <option value="">Choose...</option>
			                  <option>Illinois</option>
			                </select>
			              </div>
			
			              <div className="col-md-3 mb-3">
			                <label for="invoice-zip" className="form-label">Zip</label>
			                <input type="text" className="form-control" name="invoice-zip" placeholder="12345" />
			              </div>
			            </div>
			
			          </div>
			
			          <div className="col-md-6">
			            <div className="mb-3">
			              <label for="invoice-cc-number" className="form-label">Credit card number</label>
			              <input type="text" className="form-control" name="invoice-cc-number" />
			            </div>
			
			            <div className="row">
			              <div className="col-md-6">
			                <label for="invoice-cc-expiration" className="form-label">Expiration</label>
			                <input type="text" className="form-control" name="invoice-cc-expiration" />
			              </div>
			
			              <div className="col-md-6">
			                <label for="invoice-cc-cvv" className="form-label">CVV</label>
			                <input type="text" className="form-control" name="invoice-cc-cvv" />
			              </div>
			            </div>
			          </div>
			        </div>
			      </div> 
			
			      
			      <div className="billing-method-subform collapse" id="selfpay-subform">
			        <h5 className="mb-3">Destination Account Information</h5>
			        <label for="selfpay-destination-account" className="form-label">AWS Organizations Management Account ID</label>
			        <input type="text" className="form-control" name="selfpay-destination-account" placeholder="AWS Account ID" />
			      </div>
			
			      
			      <div className="billing-method-subform collapse" id="strides-subform">
			        <h5 className="mb-3">STRIDES Participation Details</h5>
			        <label for="strides-id" className="form-label">NIH STRIDES Account Number</label>
			        <input type="text" className="form-control" name="strides-id" />
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
}

export default RequestWorkspace;
