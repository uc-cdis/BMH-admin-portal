/* Ensures that the user is logged in, otherwise redirect to login page */
var BMH = window.BMH || {};

(function scopeWrapper($) {
   
    // Updates #user_email with email
    BMH.user_email.then(function setUsername(email) {
        if(email) {
            $("#user_info").show();
            $("#user_email").text(email);
        } else {
            console.log("Could not retrieve user email");
            window.location.href = "signin.html"
        }
    }).catch(function handleUsernameError(error) {
        console.log("Fetch User Email Error: " + error);
        window.location.href = 'signin.html'
    });

    /*
     *  Event Handlers
     */
    $(function onDocReady() {
        $('#logout').click(handleLogOut);
    });

    function handleLogOut(event) {
        event.preventDefault();
        BMH.signOut();
        window.location.href = 'signin.html';
    }

}(jQuery));