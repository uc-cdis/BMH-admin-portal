import React, { Component } from 'react';
import LoginButton from '../components/login-button';

class LoginForm extends Component {
  state = {
    account: { email: '', password: '' }
  }

  handleSubmit = e => {
    e.preventDefault();

    console.log('submitted')
  }

  handleChange = e => {
    const account = { ...this.state.account };
    account[e.currentTarget.name] = e.currentTarget.value;
    this.setState({ account });
  }

  render() {
    return (
      <div className="container">
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <h1>BRH Portal Login</h1>
        <br/>
        <br/>
        <form onSubmit={this.handleSubmit}>
          {/*<div className="mb-3">
            <label htmlFor="exampleInputEmail1" className="form-label">Email address</label>
            <input value={this.state.account.email} onChange={this.handleChange} name="email" type="email" className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" />
          </div>
          <div className="mb-3">
            <label htmlFor="exampleInputPassword1" className="form-label">Password</label>
            <input value={this.state.account.password} onChange={this.handleChange} name="password" type="password" className="form-control" id="exampleInputPassword1" />
          </div>*/}
          
          <LoginButton />       
          
        </form>
      </div>
    )
  }
}
// <button type="submit" className="btn btn-primary">Submit</button>
export default LoginForm;
