$(document).ready(function(){
  var ASC = RIPPLE.session.mainController
    , UTIL = RIPPLE.session.utilController
    , DISPLAY = RIPPLE.session.displayController
    , CHAT = new ChatController()
    , choicePopoverOpen = false
    , clientStatusBtn = $('#client-status-btn')
    , clearBtn = $('#clear-btn')
    , responseResizerHold = false;

  now.initialize = function(){
    // Clear Student Questions
    now.distributeClear();

    // Set room number
    $('#loading').hide();
    $('#question-response-wrap').show();
    $('#roomDisplay').html(now.room)
    $('#room-display-btn').slideDown();

    // Load Set if needed
    loadSet();
  }

  // Must be available to now or throws errors
  now.clientClearQuestion = function(){};
  now.clientSetPolling = function(){};
  now.clientStopSession = function(){};

  now.receiveMessage = function(name, message){
    CHAT.receiveMessage(name, message);
  }

  now.receiveAnswer = function(clientID, name, answer){
    ASC.recieveAnswer(clientID, name, answer);
  }

  now.receiveQuestion = function(name, message){
    
  }
  // Make editor wysiwyg
  $('#qTxt')
    .wysihtml5( GLOBALS.wysihtml5Options )
    //Move modal to body for bug fix of modal being behind overlay layer
    $('.bootstrap-wysihtml5-insert-image-modal, .bootstrap-wysihtml5-insert-link-modal').appendTo('body')

  // Check to see if session was reloaded
  if( GLOBALS.reload ) DISPLAY.reloadPrompt();

  // Have logout close parent window
  $('#btn-close-session').on('click keypress', function(e){
    if( !isKeypressEnter(e) ) return;
    DISPLAY.confirmClose();
  });
  
  // Presenter closes window
  $(window).bind("beforeunload", function(){
    now.distributeStopSession();
  });

  $('#question-response-wrap').hide();
  $('#room-fullscreen').click(function(e){ 
    roomURL = "<div class='roomLinkDisplay'>Room ID: <strong>" + now.room + "</strong></div>";
    DISPLAY.showRoomFullscreen(roomURL, 'Room ID:'); 
    e.preventDefault();
  });

  // Send Message
  $("#message-btn").click(function(){
    CHAT.sendMessage(now.distributeMessage);
  });
  $('#message-txt').blur(function(){
    window.scrollTo(0,1);
  });

  // Send Question
  $("#send-btn").click(function(){
    // Disable button for 1 second so that double clicks do not initiate sends
    $(this).attr('disabled','disabled');
    setTimeout(function(){
      $("#send-btn").removeAttr('disabled');
    }, 1000);
    // Resest Polling
    setPolling("on");
    // Send Question Out
    ASC.sendQuestion(now.distributeQuestion);
    
    // Show Stop & Clear btn
    clientStatusBtn.show();
    clearBtn.show();

  });

  // Clear Question
  clearBtn.on("keydown click", function(e){
    if( !isKeypressEnter(e) ) return;
    DISPLAY.reset('clear');
    ASC.clearAnsVals(now.question.type);
    now.distributeClear();
    $('#client-status-btn, #clear-btn').hide();
  });

  // Stop and Restart Client Polling
  $('#client-status-btn').on("keydown click", function(e){
    if( !isKeypressEnter(e) ) return;
    pollingToggle($(this));
  });

  // Window resizer
  $('#window-resizer').on('click keypress', function(e){
    var $this = $(this)
      , newTitle
      , iconContract = 'icon-resize-small'
      , iconExpand = 'icon-resize-full'
      , removeClass
      , addClass
      , icon = "";

    if( !isKeypressEnter(e) ) return;

    if( $this.find('i').hasClass(iconContract) ){
      window.resizeTo(320,screen.height);
      newTitle = "Expand Window";
      removeClass = iconContract;
      addClass = iconExpand;
    } else {
      window.resizeTo(screen.width,screen.height);
      newTitle = "Minimize Window";
      removeClass = iconExpand;
      addClass = iconContract;
    }
    // Update button
    $this
      .attr('title', newTitle)
      .tooltip('fixTitle')
      .tooltip('hide')
      .find('i')
        .removeClass(removeClass)
        .addClass(addClass);
  })

  // Expand Response to take full width
  $("#response-resizer").on('click keypress', function(e){
    if( !isKeypressEnter(e) ) return;

    if( $(this).find('i').hasClass('icon-resize-full') ) sizeResponse('max');
    else sizeResponse('min');
  });

  // Collapse Answer Option Area in smaller screens
  $('#question-wrap').on('click keypress', '#qOption-chevron', function(e){
    if( !isKeypressEnter(e) ) return;

    DISPLAY.qOptionToggle('toggle');
  })

  // Add Resizing when
  $('#slidebar-btn').click(function(){
    checkResponseSize();
  });

  // Flash functionality
  $('#answers')
    // Show answers
    .on("click keypress", "#flash-show", function(e){
      if( !isKeypressEnter(e) ) return;
      
      ASC.setOpenFlash( false );
      $('#answers .flashwell').stop(true, true).show();
      $('#flash-hide').show();
      $(this).hide();
    })
    // Hide answers
    .on("click keypress", "#flash-hide", function(e){
      if( !isKeypressEnter(e) ) return;
      
      ASC.setOpenFlash( true );
      $('#answers .flashwell').hide();
      $('#flash-show').show();
      $(this).hide();
    })
    .on("click keypress", ".flashwell .remove-response", function(e){
      var $this = $(this);
      if( !isKeypressEnter(e) ) return;
      // Hide well
      $this.closest(".flashwell").addClass('hidden');
    });

  $("#type").change(function(){
    displayQuestion($(this).val());
    if( $('#set-questions').length ) $('#set-questions').val(0);
  });

  // Hide all the progress labels
  $('.ui-progress .ui-label').hide();

  //hide button choices div
  $('#question-choices-wrap').hide();

  // Make Bootstrap Dropdown
  $('.dropdown-toggle').dropdown();

  // Make Set Question Choice create Question with correct answer
  $('#set-questions').change(function(){
    var qID = $(this).val()
      , type = (setQuestions[qID]['type']) ? setQuestions[qID]['type'] : "";

    $('#type').val(type);
    displayQuestion(type);

    var typeSelect = $('#type');
    typeSelect.find('option').removeAttr('selected');
    typeSelect.find('option[value="' + type + '"]').attr('selected', 'selected');

    DISPLAY.fillOptions(setQuestions[qID]);
  });

  // Show/Hide Answer Option Area
  answerOptionDisplay( $('#type').val() );
  displayQuestion($('#type').val());
  
  // Toggle Individual Response Names
  $('#toggle-names button').on('click keydown', function(e){
    // Only run if click was enter or it was a keypress enter
    if( !isKeypressEnter(e) ) return;

    var $this = $(this)
      , stateClass = $this.attr('data-state')
      , jToggleName = $('#toggle-names')
      , jResponses = $('#responses')
      , hideClass = 'hide-names'
      , activeClasses = 'btn-primary btn-active';
    // Change Active State
    if( stateClass === hideClass)
      jResponses.addClass(hideClass);
    else
      jResponses.removeClass(hideClass);

    jToggleName.find('button').removeClass(activeClasses);
    $this.addClass(activeClasses);

  });

  var loadSet = function(){
    // Prefill first Question from set
    if( $('#set-questions').length != 0 ) {
      var firstID = 0;

      // Hide display of #type selector
      $('#type').hide();
      $('#type-header').show();

      // identify the first question ID
      for( var item in setQuestions){
        firstID = item;
        break;
      }

      // Make the set selector the right value
      $('#set-questions').val(firstID);
      // Set the question type
      var setQType = setQuestions[firstID]['type'];
      $('#type').val(setQType)
      displayQuestion( setQType );

      // Fill data in for first question in set
      DISPLAY.fillOptions( setQuestions[firstID] );

      // Popover functionality to "Add a Question"
      popover( $('#btn-question-choice'), "bottom" );

      // Make popover hide if clicked outside or close w/ "esc"
      $(document)
        .mousedown(function(e){
          //Do not Fire Action for Question Choice Button
          if( e.target.id == "btn-question-choice") return false;

          // Close Popover if open
          if( choicePopoverOpen ) {
            popoverClose();
            choicePopoverOpen = false;
          } 

        })
        .on('keydown', function(e){
          if( isKeypressEsc(e) ) {
            // Disregard if popover is not open
            if( !popoverOpen ) return;
            // Close Popover
            popoverClose();
            choicePopoverOpen = false;
            $('#btn-question-choice').focus();
          }
        });

      // Make popover buttons functional
      $(document).on('mousedown', 'button.question-type', function(){
        var type = $(this).attr('data-qtype') ;
        $('#type').val( type );
        displayQuestion( type );
        $('#set-questions').val(0);
      });

      // Previous & Next Button actions
      $('#set-prev-btn').on('click keypress', function(e){
        // Only run if click was enter and it was a keypress
        if( !isKeypressEnter(e) ) return
        cycleSetQuestion(e, 'prev');
      })
      $('#set-next-btn').on('click keypress', function(e){
        // Only run if click was enter and it was a keypress
        if( !isKeypressEnter(e) ) return      
        cycleSetQuestion(e, 'next');
      })

      // Wysiwyg UX
      $('#question .wysihtml5-toolbar a.btn')
        // Make buttons tab able
        .attr('tabindex', "0")
        // Make buttons have tooltips
        .attr('data-placement', "top")
        .tooltip(); 
    }
  }

  $(window).resize(function() {
    checkResponseSize();
  });

  function displayQuestion(type){
    // Check for Required Class, Methods and Parameters
    var passCheck = RIPPLE.checkClass(type)
      , qTypeClass = RIPPLE.questionType[type];

    // Clear Display
    DISPLAY.reset('wipe');
    DISPLAY.answers("");

    // Clear Timers
    ASC.clearTimers();

    /**
     * Hook fired when a question type is displayed.
     * 
     * @event displayQuestionFn
     */
    var hasClearFn = qTypeClass.hasOwnProperty('displayQuestionFn');
    if( passCheck && hasClearFn ) qTypeClass.displayQuestionFn();

    /**
     * Property to determine if a question type displays the answer
     * option area.
     *
     * @property displayOptions
     * @for plugin-client.session
     * @type boolean
     * @default null
     */
    var hasClearFn = qTypeClass.hasOwnProperty('displayOptions');
    if( passCheck && hasClearFn ) DISPLAY.answerOptionDisplay( qTypeClass.displayOptions );
    else DISPLAY.answerOptionDisplay( false );

    // Hide Start/Stop btn
    setPolling('on');
    clientStatusBtn.hide();

    // Hide Clear Button
    clearBtn.hide();

    // Replicate header for Session with Sets
    $('#type-header').html( $('#type :selected').text() );

    // Clear Student Questions
    if( now.hasOwnProperty('distributeClear') ) now.distributeClear();  

    // Check for tooltips
    $('#qOptions [rel="tooltip"]').tooltip();    
  }

  function cycleSetQuestion(e, direction){
    var setSelect = $('#set-questions')
      , setSelectLen = setSelect.find('option').length
      , selectIndexLen = setSelectLen - 1
      , setSelectIndex = setSelect.prop("selectedIndex");
    
    // Determine direction and index to move to
    if (direction === 'prev') {
      // If it is the first question item then move to the last of the list
      if( setSelectIndex === 1 ) setSelectIndex = selectIndexLen
      else setSelectIndex--;
    } else if(direction === 'next') {
      if(setSelectIndex === selectIndexLen ) setSelectIndex = 1;
      else setSelectIndex++;
    }
    // Set new selectedIndex
    setSelect.prop("selectedIndex", setSelectIndex);
    // Display new question information
    var qID = setSelect.val()
      , type = setQuestions[qID]['type'] ? setQuestions[qID]['type'] : "";
    
    $('#type').val( type );
    answerOptionDisplay( type );
    displayQuestion( type );
    DISPLAY.fillOptions( setQuestions[qID] );    
  }

  function sizeResponse(status){
    if( responseResizerHold ) return false;

    var $resizer = $('#response-resizer')
      , title
      , addClass
      , removeClass
      , wrapWidth
      , wrapMinHeight
      , wrapRemoveClass = ""
      , wrapAddClass = ""
      , iconMax = 'icon-resize-full'
      , iconMin = 'icon-resize-small'
      , wrap = $("#response-wrap")
      , parent = wrap.parent()
      , type = $('#type').val();

    switch(status){
      case "max":
        // Make space for the response what will be taken out of flow
        parent.css("height", parent.css("height") );
        // Add class which makes div position absolute
        wrapMinHeight = $('#question-wrap').height() - 340;
        wrapAddClass = 'max';
        // Button Atrributes
        title = "Minimize Responses"
        addClass = iconMin;
        removeClass = iconMax;
        break;
      case "min":
        // Make parent auto height
        parent.css("height", "auto");
        // Put div back in flow of page        
        wrapMinHeight = "auto";
        wrapRemoveClass = 'max';
        // Button Atrributes      
        title = "Expand Responses"
        addClass = iconMax;
        removeClass = iconMin;
        break;
    }

    // Make container width correct
    wrap
      .addClass(wrapAddClass)
      .removeClass(wrapRemoveClass)
      .css("width", wrapWidth)
      .css("min-height", wrapMinHeight);

    $resizer
      .attr('title', title)
      .tooltip('hide')
      .tooltip('fixTitle')
      .find('i')
        .removeClass(removeClass)
        .addClass(addClass)

    // Make sure resizer is effected by double clicks
    responseResizerHold = true;
    setTimeout(function(){
      responseResizerHold = false;
    }, 100)

    /**
     * Hook fired when the response area is resized on Client UI
     *
     * @event resizeAnswersFn
     * @for plugin-client.session
     */
    // Check for Class, Methods, & Params
    var passCheck = RIPPLE.checkClass(type);
    var hasClearFn = RIPPLE.questionType[type].hasOwnProperty('resizeAnswersFn');
    if( passCheck && hasClearFn ) RIPPLE.questionType[type].resizeAnswersFn();    
  }

  function checkResponseSize(){
    if( $('#response-wrap').hasClass('max') ) {
      sizeResponse('max');
    }
  };

  function popover(jElem, placement){
    jElem.popover({
      trigger: 'manual',
      content: $('#question-choices-wrap').html(),
      placement: placement,
      title: "Available Question Types",
      html: true
    }).click(function(e){
      position = ( $(this).attr('data-panel-position') ) ? $(this).attr('data-panel-position') : "";
      positionRef = $(this).closest('.question-set-section');
      popoverToggle();
      // Current focus of popover cases consistency issue so it is commented out
      // May be added back in at a later point if resolved
      // if( keyCode(e) ) popoverFocus();
    })
  }

  function answerOptionDisplay(type){
    var answerOption = $('#question-wrap .answer-options')
      , display = false;

    // Determine if answer option is needed.
    switch(type){
      case 'multiple-choice':
        display = true;
        break;
      case 'slider':
        display = true;
        break;
      case 'numeric':
        display = true;
        break;
    }

    if( display == true ) answerOption.show();
    else answerOption.hide();
  }
  
  function popoverToggle(){
    if( !choicePopoverOpen ) {
      popoverOpen();
      choicePopoverOpen = true;
      popoverFocus();
    } else {
      popoverClose();
      choicePopoverOpen = false;
    }  
  }

  function pollingToggle($jElem){
    var status = $jElem.attr('data-action')
      , state = "";

    // Toggle state & attributes
    if( status === "stop") {
      state = "off";
      newStatus = "stop";
    } else {
      state = "on";
      newStatus = "start";
    }

    setPolling( state );
    if( $('#type').val() === 'dial' 
      ||  $('#type').val() === 'slider' ) ASC.graphPolling( newStatus );
    now.question.polling = state;
    now.distributePolling( state );
  }

  function setPolling (state){
    var btnContent = ""
      , dataAction = ""
      , startHtml = "Start <i class='icon-repeat'></i>"
      , stopHtml = "Stop <i class='icon-remove'>"

    if( state === "on" ){
      ASC.setPolling(true);
      btnContent = stopHtml;
      dataAction = "stop";
    } else {
      ASC.setPolling(false);  
      btnContent = startHtml;
      dataAction = "start";
    }
    clientStatusBtn.attr("data-action",dataAction).html(btnContent).show();
  }

});

function popoverClose() {
  $('#btn-question-choice').popover('hide'); 
}

function popoverOpen() {
  $('#btn-question-choice').popover('show');
}

function popoverFocus(){
  setTimeout(function(){
    $('.popover button:first').focus();
  }, 250);
}
