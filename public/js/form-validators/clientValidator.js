function ClientValidator() {

	this.alert = $('.modal-form-errors');

	this.showErrors = function(a) {
		$('.modal-form-errors .modal-body p').text('Please correct the following problems :');
		var ul = $('.modal-form-errors .modal-body ul');
			ul.empty();
		for (var i=0; i < a.length; i++) ul.append('<li>'+a[i]+'</li>');
        this.alert.modal('show');
	};
    
};

ClientValidator.prototype.answer = function(type) {
	var err = []
	  , errMsg = "";

  // Check for Class, Methods, & Params
  var passCheck = RIPPLE.checkClass(type);
  if( !passCheck ) return false;
  if( RIPPLE.questionType[type].hasOwnProperty('validFn') ) errMsg = RIPPLE.questionType[type].validFn();

	if( errMsg.length ) err.push(errMsg);
	if (err.length) this.showErrors(err);
	return err.length === 0;
}
	
	