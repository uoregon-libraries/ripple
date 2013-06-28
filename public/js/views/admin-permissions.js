$(document).ready(function(){
	var NOTIFY = new NotifyController();
	// Send Role Change to server
	$('#permissions input[type="checkbox"]').click(function(){
		// console.log( $(this) );
		var that = $(this)
      , objID = $(this).attr("id")
      , role = $(this).attr("data-role")
      , data = ""
      , action  = "";

    // Data
    if( $(this).attr("checked") ) action = "add";
    else action = "remove";
    data = 'objid=' + objID + '&role=' + role + '&action=' + action;
    // Post and Notify
    NOTIFY.postData(document.URL, data).complete(function(){

    });
	});
});