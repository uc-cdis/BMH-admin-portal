$(document).ready(function() {

    $(".toast").toast("show")

    // Billing Method selection UI
    $(".billing-method-radio").click(function() {
        $(".billing-method-subform").hide();
        $("#" + this.id + "-subform").show();
    });

    $("#click-me").on("click", function(e) {
        $("#response-alert").fadeToggle("slow")
    });


    $("#request-form-submit-button").on("click", function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (!(this.checkValidity() === false)) {
            $.ajax({
                url: '{{ api_url }}{{ resource_name }}',
                type: 'POST',
                contentType:'application/json',
                crossDomain: true,
                data: JSON.stringify( $('#request-workspace-form').serializeArray() ),
                success:function(result) {
                    var ele = $("#response-alert");
                    ele.html("Success! Recieved request: " + result['request_id']);
                    ele.removeClass("alert-error alert-success");
                    ele.addClass("alert-success");
                    ele.fadeIn(1000);
                    window.setTimeout(function() {
                        ele.fadeOut(1000); 
                    }, 3000);
                },
                error: function(xhr, result) {
                    var ele = $("#response-alert");
                    console.log(result)
                    ele.html("There was an error submitting your request. Please try again later.");
                    ele.removeClass("alert-danger alert-success");
                    ele.addClass("alert-danger");
                    ele.fadeIn(1000);
                    window.setTimeout(function() {
                        ele.fadeOut(1000); 
                    }, 3000);
                }
            })
        }

        $('#request-workspace-request-form').addClass('was-validated');
    })



});