
function NotifyController(){
	this.postData = function(postURL, postData) {
		var that = this;

		var postAjax = $.ajax({
			url: postURL,
			type: 'POST',
			data: postData,
			success: function(json){
				//json = $.parseJSON(json);
				if( json.success === "1") $.jGrowl(json.message, { header: "Successful!" });
				else $.jGrowl(json.message, { header: "ERROR" });
			},
			error: function(jqXHR){
				$.jGrowl(jqXHR.responseText+' :: '+jqXHR.statusText);
			},	
		});

		return postAjax;
	}	
}