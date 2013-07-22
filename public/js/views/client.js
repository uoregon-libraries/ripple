$(document).ready(function(){
  var CC = RIPPLE.client.controller
    , CHAT = new ChatController();

  var holdModal = $('#response-hold-modal');

  // Check for Mobile Device that have been asleep
  var intTime = new Date().getTime();
  var getTime = function() {
      var intNow = new Date().getTime();
      if (intNow - intTime > 2000) {
          location.reload(true);
      }
      intTime = intNow;
      setTimeout(getTime,1000);
  };
  getTime();

  // Set Initial Room
  $('#displayRoom').html( $('#room').val() );

  // Hide Send
  $('#send-button, #answer').hide();

  now.receiveQuestion = function(name){
    var timestamp = new Date().getTime();
    
    // Make sure that overlay is closed
    holdModal.modal('hide');

    // Show question
    CC.showQuestion();
  }

  now.clientClearQuestion = function(){
    CC.clearQuestion();
    holdModal.modal('hide');
  }

  now.clientSetPolling = function(status){
    if(status === "off") holdModal.modal('show');
    else holdModal.modal('hide');
  }

  now.receiveMessage = function(name, message){
    CHAT.receiveMessage(name, message);
  }

  now.initialize = function(){    
    // Set initial question
    $('#question').html("<h2>You're in Room <span id='displayRoom'>" + now.room + "</span>... Waiting for Question</h2>");
    
    // Grab Question if it is already out there
    if(now.question !== null || now.question.qTxt !== undefined){
      CC.showQuestion();
    }      

    // Set room number
    $('#roomDisplay').html('Room ID: ' + now.room).slideDown();

    if( $.cookie('client.name') == null ){
      if( typeof now.name === 'undefined' || now.name === "" ){
        //Prompt for name
        promptName = prompt("What's your name?", ""); 
        // If name is not returned from prompt then generate one.
        now.name = (promptName !== "") ? promptName : "Anonymous::"+Math.floor(Math.random()*9999);
      }
      // Set Cookie
      $.cookie('client.name', now.name, { expires: 1 }); 
    } else {
      if(typeof now.name === 'undefined' || now.name === "") now.name = $.cookie('client.name');
      $('#clientName').text("- " + now.name);
    }

    now.setName(now.name);

    // Turn on if overlay is now.question polling is off
    var onHold = 'question' in now && now.question.polling === 'off';
    if( onHold ) $('#response-hold-modal').modal('show');
  
  }

  // Window Resize
  $(window).resize(function(){
    var type = now.question.type;
    /**
     * Hook called when client's browser is resized
     *
     * @event resizeFn
     * @for plugin-client.client
     */
    // Check for Class, Methods, & Params
    var passCheck = RIPPLE.checkClass(type)
    if( !passCheck ) return false;
    if( RIPPLE.questionType[type].hasOwnProperty('resizeFn') ) RIPPLE.questionType[type].resizeFn();

  });

  // Wire-up Answers Buttons for Response
  var activeInputs = '#answer :input[type="button"], #answer button:not(".no-submit"), #send-button, #answer .button-answer'
   ,  activeTxtboxs = '#open-response, #numeric, #cloud';
  $('#content').on('click', activeInputs, function(e){
    CC.sendInAnswer(this, e);
  }).on('keydown', activeTxtboxs, function(e){
    if( isOnlyKeypressEnter(e) ) CC.sendInAnswer(e);
  })

  // Functionality when presenter put admin UI on stop
  // Currently in development
  $('#response-hold-modal').modal({
    backdrop: 'static',
    keyboard: false,
    show: false
  });

  // Send Message
  $("#message-btn").click(function(){
    CHAT.sendMessage(now.distributeMessage);
  });
  $('#message-txt').blur(function(){
    window.scrollTo(0,1);
  });

});
