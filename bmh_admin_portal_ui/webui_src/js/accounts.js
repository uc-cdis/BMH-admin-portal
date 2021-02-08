var BMH = window.BMH || {};

(function accountsScopeWrapper($) {

    function editLimits(event) {
        event.preventDefault();
        var cur_soft_limit = $('#soft-limit-cell').text();
        var cur_hard_limit = $('#hard-limit-cell').text();
        $("#soft-limit-cell").html('<input type="text" id="soft-limit-input" name="soft-limit" value="'+cur_soft_limit+'"></input>');
        $("#hard-limit-cell").html('<input type="text" id="hard-limit-input" name="hard-limit" value="'+cur_hard_limit+'"></input>');
        $('#edit-limits-button').text("Submit");
        $('#edit-limits-button').off('click').on('click', submitLimits);
    };

    function submitLimits(event) {
        event.preventDefault();
        $('#edit-limits-button').text("Edit");
        $('#edit-limits-button').off('click').on('click',editLimits);

        $("#soft-limit-cell").text($('#soft-limit-input').val());
        $("#hard-limit-cell").text($('#hard-limit-input').val());
    }
    
    $(document).ready(function() {
        $('[data-toggle="tooltip"]').tooltip();
        $('#edit-limits-button').click(editLimits);
        $('#request-new-workspace-button').click(handleRequestNewWorkspace);
    });

    function handleRequestNewWorkspace(event) {
        event.preventDefault();
        window.location.href = "request_workspace.html";
    };
}(jQuery));
