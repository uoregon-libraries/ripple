function SetValidator() {
  this.fieldID = {
    setName : '#setName-tf'
  };

  this.alert = $('.modal-form-errors');

  this.showErrors = function(a) {
    $('.modal-form-errors .modal-body p').text('Please correct the following problems :');
    var ul = $('.modal-form-errors .modal-body ul');
      ul.empty();
    for (var i=0; i < a.length; i++) ul.append('<li>'+a[i]+'</li>');
        this.alert.modal('show');
  }
    
  this.validSetName = function(){
    var errMsg = null
      , $thisVal = $(this.fieldID.setName).val();
    if ( $thisVal === "" ) errMsg = "Please provide a Set Name."
    if ( /[()\.\/]/g.test( $thisVal ) ) errMsg = "You cannot use the characters (,),.,/ in the set name."

    return errMsg || false;
  }
}

SetValidator.prototype.validateSet = function(questionType) {
  var err = []
    , errMsg = "";

  errMsg = this.validSetName();      

  if( errMsg.length ) err.push(errMsg);
  if (err.length) this.showErrors(err);
  return err.length === 0;
}