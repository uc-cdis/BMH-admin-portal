var BMH = window.BMH || {};

(function requestFormScopeWrapper($) {

    var authToken
    BMH.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = 'signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = 'signin.html';
    });

    // Get the email from the promise
    var userEmail;
    BMH.user_email.then(function setUsername(email) {
        if(email) {
            console.log("Setting the email: " + email)
            userEmail = email;
        } else {
            console.log("Could not retrieve user email");
        }
    }).catch(function handleUsernameError(error) {
        console.log("Fetch User Email Error: " + error);
        window.location.href = 'signin.html'
    });

    $(document).ready(function() {
        $(".toast").toast("show")

        // Billing Method selection UI
        $(".billing-method-radio").click(function() {
            $(".billing-method-subform").hide();
            $("#" + this.id + "-subform").show();
        });

        $("#request-form-submit-button").on("click", function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Prepare the data for sending to the API
            data = $('#request-workspace-form').serializeArray();
            data.push({
                name: "authenticated_email",
                value: userEmail
            });
            console.log(authToken);

            if (!(this.checkValidity() === false)) {
                $.ajax({
                    url: _config.api.invokeUrl,
                    type: 'POST',
                    headers: {
                        Authorization: authToken
                    },
                    contentType:'application/json',
                    crossDomain: true,
                    data: JSON.stringify( data ),
                    success:function(result) {
                        var ele = $("#response-alert");
                        ele.html("Success! Recieved request: " + result['request_id']);
                        ele.removeClass("alert-error alert-success");
                        ele.addClass("alert-success");
                        ele.fadeIn(1000);
                        window.setTimeout(function() {
                            ele.fadeOut(1000); 
                        }, 3000);
                        //window.location.href = "index.html"
                    },
                    error: function(response, status, error) {
                        var ele = $("#response-alert");
                        alert(response.status);
                        ele.html("There was an error submitting your request. Please try again later.");
                        ele.removeClass("alert-danger alert-success");
                        ele.addClass("alert-danger");
                        ele.fadeIn(1000);
                        window.setTimeout(function() {
                            ele.fadeOut(1000); 
                        }, 3000);

                        window.location.href = "singin.html"
                    }
                })
            }

            $('#request-workspace-request-form').addClass('was-validated');
        })
    })
}(jQuery));