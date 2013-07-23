RIPPLE.questionType['open-response'] = {};

RIPPLE.questionType['open-response'].session = function(){
  var DISPLAY = RIPPLE.session.displayController
    , ASC = RIPPLE.session.mainController
    , ansObj = {}
    , initialObj = {}
    , placeHolderHtml = '';

  var display = function (){
    
    _resetObj();

    DISPLAY.answers( DISPLAY.createAnsPlaceholder() );
  }

  var _resetObj = function(){
    // Reset ansObj
    ansObj = GLOBALS.cloneObj(initialObj);
  }

  var send = function(){
    _resetObj();
    // Create html for answer area  
    var output = DISPLAY.createFlashBtn() + DISPLAY.createFlashDiv();
    
    DISPLAY.answers(output); 
  }

  var recAns = function(clientID, name, answer){
    var answerHtml = DISPLAY.createFlashAns(answer)
      , answerWell = $(answerHtml)
      , total = ASC.params("total");

    answerWell.prependTo('#flash-display');
    if( ASC.params("flashAnswers") ) answerWell.hide().fadeIn(100).fadeOut(15000);

    // Show Response
    DISPLAY.updateIndResp(name,answer);    

    // Increment Total
    ASC.incrementTotal();
  };

  var displayReset = function(){
    DISPLAY.answers( DISPLAY.createAnsPlaceholder() );
  }

  return {
    displayQuestionFn: display,
    displayOptions: false,
    sendQuestionFn: send,
    recieveAnswerFn: recAns,
    displayResetFn: displayReset
  }  
};

RIPPLE.questionType['open-response'].client = function(){
  var CC = RIPPLE.client.controller
    , inputID = "open-response";

  var display = function(){
    // Create Open Response html
    var html = '<input type="textbox" id="' + inputID + '"/>';
    html += '<div id="open-wrap" class="clear"><button class="btn btn-primary">Send <i class="icon-white icon-share-alt"></i></button></div>';
    CC.showAnswer( html );
  };

  var valid = function(){
    var errMsg = null
      , inputVal = $('#'+inputID).val()
      , isValid = GLOBALS.isString( inputVal );
    if ( !isValid ) errMsg = "Please provide an answer to submit."
    return errMsg || false;    
  };

  var send = function(){
    var ansInput = $('#'+inputID)
    CC.answer = ansInput.val();
    now.distributeAnswer({ answer: CC.answer, qID: now.question.qID });
    ansInput.hide();
    $('#answer button').prop('disabled', 'disabled');    
  };

  return {
    displayFn: display,
    validFn: valid,
    sendFn: send
  }
};

RIPPLE.questionTypeBootstrap( RIPPLE.questionType['open-response'] );
