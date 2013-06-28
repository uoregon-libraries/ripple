
function AccessController() {	
	
// bind event listeners to button clicks //
	var that = this;
	
// confirm account deletion //	
	$('#account-form-btn1').click(function(){$('.modal-confirm').modal('show')});	
	
// handle account deletion //	
	$('.modal-confirm .submit').click(function(){ that.deleteAccount(); });
	
	this.deleteAccount = function(){
		$('.modal-confirm').modal('hide');
		var that = this;	
		$.ajax({ 
			url: '/delete',
			type: 'POST',
			data: { id: $('#userId').val()},
			success: function(data){
	 			GLOBALS.showLockedAlert('Your account has been deleted.<br>Redirecting you back to the homepage.');
			},
			error: function(jqXHR){
				console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
			}
		});	
	}
};

AccessController.prototype.onUpdateSuccess = function() {
	$('.modal-alert').modal({ show : false, keyboard : true, backdrop : true });				
	$('.modal-alert .modal-header h3').text('Success!');
	$('.modal-alert .modal-body p').html('Your account has been updated.'); 				
	$('.modal-alert').modal('show');
	$('.modal-alert button').off('click');
};
