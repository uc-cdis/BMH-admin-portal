import React, { Component } from 'react';
const loadingImg =
  "https://cdn.auth0.com/blog/auth0-react-sample/assets/loading.svg";

class Loading extends Component {
  render() {
    return (
      <div className="spinner">
        <img src={loadingImg} alt="Loading..." />
      </div>
    );
  }
}

export default Loading;
