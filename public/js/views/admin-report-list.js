$(function(){
	var modalConfirm = $('.modal-confirm')
	 , activeForm = {};

	// Setup Confirmation Modal
	setupConfirm();
	$('#sets form').submit(function(e){
		activeForm['this'] = $(this);
 		activeForm['sessionNum'] = "#" + activeForm['this'].find('input[name="sessionNum"]').val();

 		modalConfirm.find('.modal-header h3').text("Delete Session " + activeForm['sessionNum'] );
    modalConfirm.modal("show");
    e.preventDefault();
	})

	modalConfirm.on('click', 'button.submit', function(e){		
		// Submit Form
		activeForm['this'].ajaxSubmit({
      success : function(responseText, status, xhr, $form){
        if (status == 'success') {   
        	activeForm['this'].parents('.report-list').remove();      
          // Notify User of creation
          $.jGrowl('Removed Session ' + activeForm['sessionNum']);
        } else {
        	$.jGrowl('ERROR :: ' + responseText );
        }
        modalConfirm.modal("hide");
      },
      error : function(e){
        $.jGrowl('ERROR :: ' + e.responseText );
        modalConfirm.modal("hide");
      }
    });
	});

	function setupConfirm(){
		// Add Notice
		var confirmMsg = "<span class='label label-important'>IMPORTANT</span> You are about to delete all data for this session. This step can not be undone!";

		modalConfirm.find('.modal-body').html(confirmMsg);
		modalConfirm.find('.modal-footer .submit')
			.addClass('btn-danger')
			.text(' Delete Session ');
 	}
});