/**
 * View for Set Creation
 *
 * @author William Myers
 */
$(function(){
	var SC = RIPPLE.set.controller
		, position = ""
		, positionRef = ""
    , popoverTarget = ""
    , jQuestions = $('#questions')
    , choiceBtn = $('#btn-question-choice')
    , jQuestion1 = ""
    , lastTabElem = "";

  // Inline Edits Configuration
  $.fn.editable.defaults.mode = 'inline';

	// Load up previous questions
	if( questions.length ){
		$.each(questions, function(i, v){
			SC.displayPrevQuestion(questions[i], null);
		});
		wireUpQuestions();
    // Set jQuestion not that they are all on screen
    jQuestion1 = $('#qTxt1');
    // Give focus to first querystring.stringify(obj, sep, eq, name);
    setTimeout(function(){
      popoverClose( choiceBtn.attr('id') );
      jQuestion1.editable("show");
    },200);
  }

  //hide button choices div
  $('#question-choices-wrap').hide();
  jQuestions.find('.sort-icon').hide();
  if( questions.length ) {
    // Default Show Options
    btnDisplayState('on', jQuestion1);
  }

  // Display Delete & Sort icons
  jQuestions
    .on('mouseenter focusin touchstart', ".question-set-section", function(){
      btnDisplayState('on', $(this) );
    })
    .on('mouseleave focusout touchstart', ".question-set-section", function(){
      btnDisplayState('off', $(this) );
    });

  // Delete Question on click
  jQuestions
    .on('mousedown keydown touchstart', '.remove-question-wrap', function(e){
      if( !isKeypressEnter(e) ) return;
      // Hide tooltip
      $(e.currentTarget).find( GLOBALS.params.tooltipSelector ).tooltip("hide");
      var qID = $(this).closest('.question-set-section').prop('id');

      $('#'+qID).remove();
      SC.deleteQuestion(qID, qSetID.value, function(){
      });
      
      e.preventDefault();
    });

  // Sort Keyboard Functionality
  jQuestions
    .on('keydown', '.sort-icon', function(e){
      var code = keyCode(e)
        , jSortIcon = $(e.currentTarget)
        , parentForm = jSortIcon.parents('form');
      // Keypress Enter
      if(code == 13) {
        // Highlight & Select Question
        if( parentForm.data('keyboard-select') != true ){
          // Change Well Color
          parentForm.addClass('highlight'); 
          // Change Form data        
          parentForm.data('keyboard-select', true);
        } else {
          // Remove Highlight
          parentForm.removeClass('highlight');
          // Remove Form data
          parentForm.data('keyboard-select', null);
        }

        // Stop form from submitting
        e.preventDefault();
      }

      if( parentForm.data('keyboard-select') != true ) return;

      // Keypress Arrow Up
      if( code == 38 ){
        var prevForm = parentForm.prev()
          , prevFormID = "#"+prevForm.attr('id');

        // If id found move and save order
        if( prevForm.length ){
          parentForm.insertBefore( prevFormID ).addClass('highlight');
          saveOrder();        
        }
        // Continue with focus
        parentForm.find('.sort-icon').focus();

        // Stop Window Scroll
        e.preventDefault();
      } else if ( code == 40 ){
        var nextForm = parentForm.next()
          , nextFormID = "#"+nextForm.attr('id');
        
        // If id found move and save order
        if( nextForm.length ){
          parentForm.insertAfter( nextFormID ).addClass('highlight');
          saveOrder();
        }
        // Continue with focus
        parentForm.find('.sort-icon').focus();

        // Stop Window Scroll
        e.preventDefault();      
      }

    })
    .on('focusout', '.sort-icon', function(e){
      var jSortIcon = $(e.currentTarget)
      , parentForm = jSortIcon.parents('form');  

      // Remove Elem Data
      if( $.data(parentForm, 'keyboard-select') ) parentForm.data('keyboard-select', null);
      // Remove Highlight
      parentForm.removeClass('highlight');
    });

  // Tooltip
  $("#set-controls").children().tooltip();

  // Popover
  $('body')
    .on('keydown', function(e){
      if( isKeypressEsc(e) ) popoverClose();
    });
  jQuestions
    .on('mouseup keyup touchend', '.btn-add-question', function(e){
     popoverToggle(e);
    })
    .on('click keypress', '.btn-add-question', function(e){
      // Stop Reload of page for button
      if(keyCode(e) !== 9 ) e.preventDefault();
    });

  jQuestions
    .on('focusout', '.question-core input', function(){
      popoverClose();
    })

  // Controls for Remove, Done, Start
  $('#remove-set-btn')
    .on('click keydown',function(e){
      if( !isKeypressEnter(e) ) return;
      var modalConfirm = $('.modal-confirm');
      // Change Modal Info
      modalConfirm.find('.modal-header h3').text('Confirm Set Delete');
      modalConfirm.find('.modal-body p').html("<span class='label label-important'>IMPORTANT</span> Are you sure that you want to delete this set?");
      modalConfirm.find('.submit').addClass('btn-danger');
      
      // Send Confirm Message
      modalConfirm.modal();
    })
    .on('click keypress', function(e){
      if(keyCode(e) !== 9 ) e.preventDefault();
    });

  $('.modal-confirm').on('click touch', 'button.submit', function(e){
    SC.removeSet(qSetID.value, function(){
      window.location.href = '/admin';
    });    
  });

  $('#done-btn')
    .on('mousedown keydown touchend',function(e){
      if( !isKeypressEnter(e) ) return;
      $.jGrowl("Changes Saved", { life: 2000 });
    })
    .on('click keypress', function(e){
      if(keyCode(e) !== 9 ) e.preventDefault();
    });  

  $('#start-btn')
    .on('mousedown keydown touchend',function(e){
      if( !isKeypressEnter(e) ) return;
      GLOBALS.openSessionWindow( $(this).attr('data-href'), e );
      e.preventDefault();
    })
    .on('click keypress', function(e){
      if(keyCode(e) !== 9 ) e.preventDefault();
    });

	// Create Popover for Type of Questions
  var popDirection = GLOBALS.dynamicPopoverDirection( choiceBtn, $('#question-choices-wrap') );
  popover( choiceBtn );
  // Open Popover by default
  if( !questions.length ) {
    popoverOpen(choiceBtn, choiceBtn.attr("id"));
    SC.popoverID = choiceBtn.attr("id");
  }
  
  // Give focus to Add a Question button by default
  // Important that this comes before wireUpQuestion
  if( !$('#qTxt1').is(':focus') ) $('.popover button:first').focus();
  // Functionality of button
  choiceBtn
    .attr('data-placement', popDirection)
    .on('mousedown keydown touchstart', function(e){
      if( !isKeypressEnter(e) ) return;

      // Reload Direction
      var popDirection = GLOBALS.dynamicPopoverDirection( choiceBtn, $('#question-choices-wrap') );
      choiceBtn.data('popover').options.placement = popDirection;
      // Toggle Popover
      popoverToggle(e);
    })
    .on('keypress click', function(e){
      if(keyCode(e) !== 9 ) e.preventDefault();
    })
  
  // Make popover hide if clicked outside
  $(document)
    .on('mousedown keydown touchstart', function(e){
      if( !isKeypressEnter(e) ) return;
      var jElem = $(e.target)

      isAddBtn = jElem.attr('id') == "btn-question-choice" 
        || jElem.hasClass('btn-add-question') 
        || jElem.parent().attr('id') == 'btn-question-choice';

      //Do not Fire Action for Question Choice Button
      if( isAddBtn ) return false;
   
      // Close Popover if open
      if( SC.popoverOpen ) {
        popoverClose();
      } 
    });

	// Make popover buttons functional
	$(document)
    .on('mousedown keydown touchstart', 'button.question-type', function(e){
  		var qType = $(this).attr('data-qtype')
  			, currentPosition = position
  			, jElem = "";

      if( !isKeypressEnter(e) ) return;

  		$('#default-choice').attr('data-qtype', qType);

  		//position = "before";
  		switch (currentPosition){
  			case 'after':
  				jElem = positionRef;
  				break
  			case 'before':
  				jElem = positionRef;
  				break
  			default:
  				jElem = jQuestions;
  		}

  		SC.addNewQuestion( qType, jElem, currentPosition, function(ID){
  			wireUpQuestions(currentPosition, ID);

        // Take focus to question
        $('#'+ID+' .editable:first').focus();
  		});
  	})    
    .on('click keypress', 'button.question-type', function(e){
      // Stop Reload of page for button
      if(keyCode(e) !== 9 ) e.preventDefault();
    });

    $('#name, #class').editable({
      params:{
        process: 'update-set'
      },
      url: location
    }) 

	function wireUpQuestions(currentPosition, formID){
    // Update Question Order in Database if question is appended or prepended to another question
    if( currentPosition === 'after' || currentPosition === 'before' ) saveOrder();

    // formID is returned when question is added by ajax
    var formID = (formID != undefined) ? '#'+formID+' ' : '';
		popover( $(formID+'.btn-add-question'), "left" );
    jQuestions.find(formID +'.icon-remove').css('color', "red").hide();	

    // Inline Editing
		$('body '+formID)    
      .find(".editable")
        .on('shown', function(e, editable) {
          var pkID = editable['$element'].closest('form').attr('id');
            SC.params('editpkID', pkID );
        })
        .editable({
          pk: findFormID,
          params: function(params){
            // URI Encode Value
            params.value = encodeURIComponent(params.value);
            // Add param for routing on admin page
            params.process = 'update-question';

            return params;
          },
          url: location,
          showbuttons: false,
          onblur: "submit",
          wysihtml5: GLOBALS.wysihtml5Options
        })
        .on('shown', function(e, editable){
          // Buf Fix Wysihtml5 Modal below overlay
          moveWysiModal();  
          $('form .wysihtml5-toolbar a.btn')
            // Make buttons tab able
            .attr('tabindex', "0")
            // Make buttons have tooltips
            .attr('data-placement', "top")
            .tooltip(); 
          $('form .editable-buttons button[type="submit"]')
            .attr('title', 'Save Changes')
            .attr('data-placement', "top")
            .tooltip();
          $('form .editable-buttons button.editable-cancel')
            .attr('title', 'Cancel')
            .attr('data-placement', "top")
            .tooltip();  
          SC.params('activeInput',$(this));           
        })
        .on('hidden', function(e, reason){
          // Check for which element is in focus and thus active
          var isActiveInput = SC.params('activeInput') === $(this);
          var focusElem = ( isActiveInput ) ? $(this) : SC.params('activeInput');
          focusElem.focus();
        })
     
    $('body '+formID)
      // Allow for inputs with class .auto-submit to ajax save
      .on("mouseout blur","input.auto-submit", function(e){
        SC.saveQuestionData($(this) );
      })
      // Make number input grab focus so that it can be edited 
      .find("input").click(function(e){
        $(this).focus();
      })
    
    // Move between Questions
    $('#questions').on('keydown', 'form.question-set-section', function(e){
      // Only proceed if it is a question set form
      if( $('#'+e.target.id).hasClass('question-set-section') ){
        var code = keyCode(e);
        if( code === 38 ) $(this).prev().focus();
        if( code === 40) $(this).next().focus();        
      }
    });

    // Make sortable
    jQuestions
      .sortable({
        handle: '.sort-icon',
        item: '.question-set-section',
        placeholder: "ui-state-highlight well",
        update: function(e,ui){
          saveOrder();
        }
      })
      .disableSelection();

    // Tooltip
    $(formID + GLOBALS.params.tooltipSelector ).tooltip();

    // Bug Fix for IE tabIndex issue
    //  Temporary fix - in future need to be able to tab to sort icon
    if( $('html.lt-ie10').length !== 0 ) $('.sort-icon').prop('tabIndex',-1);


    function moveWysiModal(){
      //Move modal to body for bug fix of modal being behind overlay layer
      $('.bootstrap-wysihtml5-insert-image-modal, .bootstrap-wysihtml5-insert-link-modal').appendTo('body')
    };

    function findFormID(){
      return SC.params('editpkID');
    };
	}

  function saveOrder(){
      // Put order into array
      var qOrderArr = [];

      $.each($('#questions .question-set-section'), function(k,v){
        qOrderArr.push( $(this).prop('id') );
      });
      SC.updateOrder(qSetID.value, qOrderArr);     
  }

  function btnDisplayState(state, jElem){
    if( state === "on"){
      // Turn all buttons off
      $('#questions .sort-icon').hide();
      $('#questions .icon-remove').hide();
      $('#questions button.btn-add-question').css('visibility', 'hidden');
      // Turn on only needed buttons for highlight
      jElem.find('.sort-icon').show()
      jElem.find('.icon-remove').show();
      jElem.find('button.btn-add-question').css('visibility', 'visible');
      lastTabElem = jElem;
    } else {
      // Check to see if elem is in same div as previous element
      if( jElem.attr('id') != lastTabElem.attr('id') ) {
        jElem.find('.icon-remove').hide();
        jElem.find('.sort-icon').hide();   
      }
    }
  }


  function popover(jElem){
    jElem.popover({
      trigger: 'manual',
      content: $('#question-choices-wrap').html(),
      title: "Available Question Types",
      html : true
    });
  }

  function popoverToggle(e){
    var itemID = e.currentTarget.id
      , $currentTarget = $(e.currentTarget);
    position = $currentTarget.attr('data-panel-position') ? $currentTarget.attr('data-panel-position') : "";
    positionRef = $currentTarget.closest('.question-set-section');
    
    e.preventDefault();

    if( !isKeypressEnter(e) ) return;

    // Deteremine current popover status
    if( SC.popoverOpen ){
      // Popover is open
      if( SC.popoverID == itemID )  {
        // Current clicked icon is what opened the current popover
        popoverClose();
      } else {
        // Current clicked icon is not same as current popover
        popoverClose(SC.popoverID);
        popoverOpen($currentTarget, itemID); 
        // Current focus of popover cases consistency issue so it is commented out
        // May be added back in at a later point if resolved
        //if( keyCode(e) ) popoverFocus();
      }       
    } else {
      // Popover is not open
      popoverOpen($currentTarget, itemID); 
      // Current focus of popover cases consistency issue so it is commented out
      // May be added back in at a later point if resolved
      //if( keyCode(e) ) popoverFocus();   
    }
  }

  function popoverClose(currentElem) {
    var popArray = [
      $('#btn-question-choice')
      , $('.btn-add-prepend')
      , $('.btn-add-append') 
    ]
    , arrLength = popArray.length;

    // These settings need to be set before animation of close otherwise
    // subsequent popoverOpen events can not fire correctly
    SC.popoverOpen = false;
    SC.popoverID = ""; 

    if( currentElem ){
      $('#'+currentElem).popover('hide');
      $.data($('#'+currentElem), "popoverOpen", false);
    } else {
      for(var i=0; i < arrLength; i++){
          popArray[i].popover('hide');
          $.data(popArray[i], "popoverOpen", false);
      }
    } 
 
  }

  function popoverOpen(currentElem, id){
    // Currently causes bug to choiceBtn where you have to click 3 times
    // to get the popover to open correctly
    //currentElem.focus();
    currentElem.popover('show');
    SC.popoverOpen = true;
    SC.popoverID = id;    
  }

  function popoverFocus(){
      $('.popover button:first').focus();
  }

});

