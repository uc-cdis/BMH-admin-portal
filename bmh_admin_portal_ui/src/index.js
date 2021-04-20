/* eslint-disable no-alert */
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from "@auth0/auth0-react";
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.css';
import './index.css';
import './css/global.css'


ReactDOM.render(

  <React.StrictMode>
      <BrowserRouter>
        {/* Auth0 provider code */}
        <Auth0Provider
          domain="dev--8buztdg.us.auth0.com"
          clientId="rapSrGYesTejllAAbMPGAK09owTqQKCx"
          redirectUri={window.location.origin}
          audience="https://dev--8buztdg.us.auth0.com/api/v2/"
          scope="read:current_user"
        >
          <App />
        </Auth0Provider>
      </BrowserRouter>,
    </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
