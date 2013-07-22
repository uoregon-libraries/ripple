
$(document).ready(function(){
	
	var lv = new LoginValidator()
		, ev = new EmailValidator();

	// Use remember me cookie to fill admin username
	if( $.cookie('presenter.username') ) {
		$('#user-tf').val( $.cookie('presenter.username') );
		$('input[name="remMe"]').prop("checked","checked");
	}

	// Clear cookie on uncheck of box
	$('input[name="remMe"]').click(function(){
		if( $(this).not(':checked') ) $.cookie('presenter.username', null); 
	})
	
	// Show Login Boxes
	$('#loader-placeholder').hide();
	$('#login-container').css("visibility","inherit");

	// bind event listeners to button clicks //		
	$('#login-form #forgot-password').click(function(){ $('#get-credentials').modal('show');});
	
	// automatically toggle focus between the email modal window and the login form //
  $('#get-credentials').on('shown', function(){ $('#email-tf').focus(); });
	$('#get-credentials').on('hidden', function(){ $('#user-tf').focus(); });

	// main login form //
	$('#login-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			if (lv.validateAdminForm() == false){
				return false;
			} 	else{
			// append 'remember-me' option to formData to write local cookie //					
				formData.push({name:'remember-me', value:$("input:checkbox:checked").length == 1})
				return true;
			}
		},
		success	: function(responseText, status, xhr, $form){
			if (status == 'success') window.location.href = '/admin';
		},
		error : function(e){
            lv.showLoginError('Login Failure', 'Please check your username and/or password');
		}
	}); 
	$('#room-num').focus();
	
	
	$('#get-credentials-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			if (ev.validateEmail($('#email-tf').val())){
				ev.processEmail();
				return true;
			}	else{
				ev.showEmailAlert("<b> Error!</b> Please enter a valid email address");
				return false;
			}
		},
		success	: function(responseText, status, xhr, $form){
			ev.showEmailSuccess("Check your email on how to reset your password.");
		},
		error : function(xhr){
			var response = xhr.responseText;
			if( response.match(/[404]/) )	ev.showEmailAlert("I'm Sorry. I could not find that email address");
			else ev.showEmailAlert("I'm Sorry. There was a system error and your email couldn't be sent");
		}
	});

	// client room form //
	$('#room-access-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			if (lv.validateRoomForm() == false){
				return false;
			} else return true;

		},
		success	: function(responseText, status, xhr, $form){
			response = $.parseJSON(responseText);
			if( response.status == "ok") {
				var room = $('#room-num').val();
				if (status == 'success') window.location.href = '/room/' + room;
			} else if( response.status == "bad-room"){
				lv.showLoginError('Invalid Room', 'Could not find the room that you typed. Please try again');
			} else if( response.status == "bad-login"){
				lv.showLoginError('Login Failure', 'Please check your username and/or password');
			}
			//e.preventDefault();
		},
		error : function(e){
      lv.showLoginError('Server Error', 'Could not connect to the server. Please try again.');
		}
	});
});

function LoginValidator(){
   
  // bind a simple alert window to this controller to display any errors //
	this.loginErrors = $('.modal-alert');
  this.loginErrors.modal({ show : false, keyboard : true, backdrop : true });

	this.showLoginError = function(t, m)
	{
	    $('.modal-alert .modal-header h3').text(t);	    
	    $('.modal-alert .modal-body p').text(m);
	    this.loginErrors.modal('show');
	}

}

LoginValidator.prototype.validateAdminForm = function()
{
	if ($('#user-tf').val() == ''){
		this.showLoginError('Whoops!', 'Please enter a valid username');
		return false;				
	}	else if ($('#pass-tf').val() == ''){
		this.showLoginError('Whoops!', 'Please enter a valid password');
		return false;
	}	else{
		return true;
	}
}

LoginValidator.prototype.validateRoomForm = function()
{
	if ($('#room-num').val() == ''){
		this.showLoginError('Whoops!', 'Please enter a valid room number');
		return false;				
	}	else{
		return true;
	}
}
