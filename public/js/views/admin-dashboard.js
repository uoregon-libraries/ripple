$(document).ready(function(){
  var SV = new SetValidator();
	
	$('#room-fullscreen').hide();

	// Override Default Start Set
	$('#set-start').on('click keypress', function(e){
		if( !isKeypressEnter(e) ) return;
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
	$('#session-start').on('click keypress', function(e){
		if( !isKeypressEnter(e) ) return;
		GLOBALS.openSessionWindow( $(this).prop('href'), e);
		e.preventDefault();
	})
	$('.question-set-section').on('click keypress', '.session-start', function(e){
		if( !isKeypressEnter(e) ) return;
		GLOBALS.openSessionWindow( $(this).prop('href'), e);
		e.preventDefault();
	});
  $('#set-create-form').on('submit',function(e){
    // Validate
    return SV.validateSet();
  })
});