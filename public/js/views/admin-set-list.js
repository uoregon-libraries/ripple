$(function(){
	$('#sets').on('click keypress', '.session-start', function(e){
		if( isKeypressEnter(e) ) GLOBALS.openSessionWindow( $(this).prop('href'), e );
	});

});