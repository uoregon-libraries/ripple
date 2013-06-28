
function ResetValidator(){
    this.alert = $('.modal-alert');
    this.alert.modal({ show : false, backdrop : 'static' });
}

ResetValidator.prototype.validatePassword = function(pass) {
	if (pass.length >= 6){
		return true;
	}	else{	
		this.showAlert('Password Should Be At Least 6 Characters', 'error');
		return false;
	}
}

ResetValidator.prototype.confirmPassword = function(pass, confirm) {
  if( pass === confirm ){
    return true;
  } else {
    this.showAlert('Passwords do not match. Please retype both.', 'error')
    return false;
  }
}

ResetValidator.prototype.showAlert = function(msg, status) {
  var header = 'Alert';

  switch(status){
    case 'error':
      header = "Error";
      break;
    case 'success':
      header = "Success";
      break;
  }
  this.alert.find('.modal-header h3').text(header);
	this.alert.find('.modal-body p').html(msg);
	this.alert.modal("show");			
}

ResetValidator.prototype.hideAlert = function() {
    this.alert.modal("hide");
}
	