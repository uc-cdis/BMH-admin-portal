/*global BMH _config AmazonCognitoIdentity AWSCognito*/

var BMH = window.BMH || {};

(function scopeWrapper($) {
    var signinUrl = 'signin.html';

    var poolData = {
        UserPoolId: _config.cognito.userPoolId,
        ClientId: _config.cognito.userPoolClientId
    };

    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    if (typeof AWSCognito !== 'undefined') {
        AWSCognito.config.region = _config.cognito.region;
    }

    BMH.signOut = function signOut() {
        userPool.getCurrentUser().signOut();
    };

    BMH.authToken = new Promise(function fetchCurrentAuthToken(resolve, reject) {
        var cognitoUser = userPool.getCurrentUser();

        if (cognitoUser) {
            cognitoUser.getSession(function sessionCallback(err, session) {
                if (err) {
                    reject(err);
                } else if (!session.isValid()) {
                    resolve(null);
                } else {
                    resolve(session.getIdToken().getJwtToken());
                }
            });
        } else {
            resolve(null);
        }
    });

    BMH.user_email = new Promise(function fetchCurrentAuthToken(resolve, reject) {
        var cognitoUser = userPool.getCurrentUser();

        if (cognitoUser) {
            // You need to get the session before getting the attributes.
            cognitoUser.getSession(function sessionCallback(err, session) {
                if(err) {
                    console.log("Error retrieving user session: " + err);
                    reject(err);
                } else if (!session.isValid()) {
                    resolve(null);
                } else {
                    cognitoUser.getUserAttributes(function fetchUserAttributes(err, attributes) {
                        if(err) {
                            console.log(err);
                            reject(err);
                        } else {
                            var email = "No Email";
                            $.each(attributes, function(i, item) {
                                if(item.getName() == "email") {
                                    email = item.getValue();
                                }
                            });
                            resolve(email);
                        }
                    });
                }
            });

            
        } else {
            resolve(null);
        }
    });

    function signin(email, password, onSuccess, onFailure) {
        var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: email,
            Password: password
        });

        var cognitoUser = createCognitoUser(email);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: onSuccess,
            onFailure: onFailure
        });
    }

    function createCognitoUser(email) {
        return new AmazonCognitoIdentity.CognitoUser({
            Username: email,
            Pool: userPool
        });
    }

    /*
     *  Event Handlers
     */
    $(function onDocReady() {
        $('#signInForm').submit(handleSignin);
    });

    function handleSignin(event) {
        var email = $('#emailInputSignin').val();
        var password = $('#passwordInputSignin').val();
        event.preventDefault();
        signin(email, password,
            function signinSuccess() {
                console.log('Successfully Logged In');
                window.location.href = 'index.html';
            },
            function signinError(err) {
                // TODO: Replace with nice looking notification
                alert(JSON.stringify(err));
            }
        );
    }
}(jQuery));
