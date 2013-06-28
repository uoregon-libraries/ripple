
function Util(){
	this.timer = []
}

Util.prototype.postData = function(postURL, postData) {

	var postAjax = $.ajax({
		url: postURL,
		type: 'POST',
		data: postData,
		success: function(json){
			//console.log('success');
			//json = $.parseJSON(json);
			if( json.success !== "1") $.jGrowl(json.message, { header: "ERROR" });
		},
		error: function(jqXHR){
			//console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
			$.jGrowl(jqXHR.responseText+' :: '+jqXHR.statusText);
		}	
	});

	return postAjax;
};

Util.prototype.monitorPostData = function(postURL, postData, monitorTime, currentTimer) {
	// Check Timer exists and clear it
	var indexTimer = $.inArray( currentTimer, Util.timer );
	if( indexTimer !== -1 ) {
		clearTimeout( Util.timer[indexTimer] );
		// Remove it from the array
		Util.timer.splice(indexTimer, 1);
	}
	
	// Set Timeout for monitor
	var newTimer = setTimeout( function(){
		Util.postData(postURL, postData);
	}, monitorTime);
	// Add Timer value to Util
	Util.timer.push(newTimer);

	return newTimer;
};

Util.prototype.createUUID = function(){
	var UUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
	});
	return UUID;
}

Util.prototype.createAlphaNumeric = function(strLength){
	var randomString = ""
	  , chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	for (var i = strLength - 1; i >= 0; i--) {
		var rnum = Math.floor(Math.random() * chars.length);
    randomString += chars.substring(rnum,rnum+1);
	};
	return randomString;
}