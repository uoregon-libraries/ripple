
$(function(){
	
	var rv = new ResetValidator()
    , passInput = $('#pass-tf')
    , confirmInput = $('#confirm-tf');	
	
	$('#set-password-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
      console.log(passInput);
			rv.hideAlert();			
      // Check for valid password
      if (!rv.validatePassword( passInput.val() ) ) {
        passInput.focus();
        return false;
      }
      // Check for confirmed password
			if ( !rv.confirmPassword( passInput.val(), confirmInput.val() ) ) {
        passInput.focus();
        return false
      }
      return true;
		},
		success	: function(responseText, status, xhr, $form){
			rv.showAlert("Your password has been reset.", "success");
			setTimeout(function(){ window.location.href = '/'; }, 3000);
		},
		error : function(){
			rv.showAlert("I'm sorry something went wrong, please try again.");
		}
	});
	passInput.focus();
	
});