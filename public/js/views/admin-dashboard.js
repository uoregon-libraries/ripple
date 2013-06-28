$(document).ready(function(){
  var SV = new SetValidator();
	
	$('#room-fullscreen').hide();

	// Override Default Start Set
	$('#set-start').click(function(e){
		var modalAlert = $('.modal-alert');
			
		modalAlert.find('.modal-body').load('/admin/set/start/ #set-create-form');
		modalAlert.find('.modal-header h3').html("Start Creating a Question Set");
		modalAlert.find('.modal-footer button').text('Cancel');
		modalAlert.modal({ show : true, keyboard : true, backdrop : true });

		setTimeout(function(){
			$('#setName-tf').focus();
		},50)
		e.preventDefault();
	})

	// Overide Session Start to put in new window
	$('#session-start').click(function(e){
		GLOBALS.openSessionWindow( $(this).prop('href'), e);
	})
	$('.question-set-section').on('click', '.session-start', function(e){
		GLOBALS.openSessionWindow( $(this).prop('href'), e);
	});
  $('#set-create-form').on('submit',function(e){
    // Validate
    return SV.validateSet();
  })
});