$(function(){
	$('#sets').on('click', '.session-start', function(event){
		GLOBALS.openSessionWindow( $(this).prop('href'), event );
	});

});