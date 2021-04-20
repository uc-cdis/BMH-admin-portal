import React, { Component } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import NavBar from './components/nav-bar';
import Loading from './components/loading';
import WorkspaceAccounts from './views/workspace-accounts';
import RequestWorkspace from './views/request-workspace';
import LoginForm from './views/login-form';
import LoginCallback from './views/login-form';
import { withAuth0 } from '@auth0/auth0-react';
import './App.css';

class App extends Component {
  state = {};

  async getJWT() {
    const { getAccessTokenSilently } = this.props.auth0;

    try {
      const accessToken = await getAccessTokenSilently({
        audience: "https://dev--8buztdg.us.auth0.com/api/v2/",
        scope: "read:current_user"
      })

      window.localStorage.setItem('token', accessToken);

    }
    catch (e) {
      console.log(e.message);
    }
  }

  render() {
    const { isLoading, isAuthenticated } = this.props.auth0;

    if (isLoading) {
      return <Loading />;
    }

    if (isAuthenticated) {
      this.getJWT();
    }

    return (
      <div className="App">
        <NavBar isAuthenticated={isAuthenticated}/>
        <div className="container">
          <Switch>
            {/* Public routes meant for login */}
            <Route path="/login" component={LoginForm}/>
            <Route path="/login/callback" component={LoginCallback}/>
            
            {/* React Router protected routes */}
            <Route 
              path="/request-workspace" 
              render={props => {
                if (!isAuthenticated) return <Redirect to="/login" />;
                return <RequestWorkspace {...props}/>;
              }}/>
            <Route 
              path="/" 
              render={props => {
                if (!isAuthenticated) return <Redirect to="/login" />;
                return <WorkspaceAccounts {...props}/>;
              }}/>
          </Switch>
        </div>
      </div>
    );
  }
}

export default withAuth0(App);
