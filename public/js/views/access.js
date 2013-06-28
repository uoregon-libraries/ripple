
$(document).ready(function(){
	
	// customize the account settings form //
	
	$('#account-form h1').text('Profile');
	$('#account-form #sub1').text('Here are the current settings for your account.');
	$('#user-tf').attr('disabled', 'disabled');
	$('#account-form-btn1')
    .html(' Delete ')
    .addClass('btn-submit');
	$('#account-form-btn2')
    .html(' Update ')
    .addClass('btn-primary');

	// setup the confirm window that displays when the user chooses to delete their account //

	$('.modal-confirm').modal({ show : false, keyboard : true, backdrop : true });
	$('.modal-confirm .modal-header h3').text('Delete Account');
	$('.modal-confirm .modal-body p').html('Are you sure you want to delete your account?');
	$('.modal-confirm .cancel').html('Cancel');
	$('.modal-confirm .submit')
    .html(' Delete Account ')
	  .addClass('btn-danger');

});