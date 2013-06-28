RIPPLE.questionType['cloud'] = {};

RIPPLE.questionType['cloud'].session = function(){
  var DISPLAY = RIPPLE.session.displayController
    , ASC = RIPPLE.session.mainController
    , ansObj = {}
    , initialObj = {};

  var init = function(){
    $(document).ready(function(){
      // Generate Word Cloud
      $('#answers').on("click", "#word-cloud", function(){
        ASC.setOpenCloud( true );    
        $(".dynacloud").dynaCloud();
      })
    })
  }();

  var display = function (){
    _resetObj();

    DISPLAY.answers( DISPLAY.createAnsPlaceholder() );
  };

  var _cloud = function(){
    var output = DISPLAY.createFlashBtn();
    output += '<div id="dynacloud"></div><div id="word-display"></div>';
    DISPLAY.answers(output);

    // Set Word Cloud Option
    $.dynaCloud.auto = false;
    $.dynaCloud.scale = 2;
    //$.dynaCloud.stopwords = ["I", "me", "him"];
    $(".dynacloud").dynaCloud();    
  } 

  var _resetObj = function(){
    // Reset ansObj
    ansObj = GLOBALS.cloneObj(initialObj);
  };

  var send = function(){
    _resetObj();
    
    // Generate Cloud Html & functionality
    _cloud();
  };

  var recAns = function(clientID, name, answer){
    var answerHtml = DISPLAY.createFlashAns(answer)
      , answerWell = $(answerHtml).addClass('dynacloud');
    answerWell.prependTo('#word-display');
    if( ASC.params("flashAnswers") ) answerWell.hide().fadeIn(100).fadeOut(15000);

    // Only Show Cloud if it is requested
    $(".dynacloud").dynaCloud();

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

RIPPLE.questionType['cloud'].client = function(){
  var CC = RIPPLE.client.controller
    , inputID = 'cloud';

  var display = function(){
    // Create Open Response html
    var html = '<div class="cloud-wrap"><input type="textbox" id=' + inputID + ' /><div class="word-note">Please provide one word response</div></div><br />';
    html += '<div id="cloud-button-wrap" class="clear"><button class="btn btn-primary">Send <i class="icon-white icon-share-alt"></i></button></div>';
    CC.showAnswer(html);
  };

  var valid = function(){
    var errMsg = null
      , patternWord = /[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?\d]/
      , patternMultiWord = /^\s*([\w]+\s*){1}$/
      , answer = $('#'+inputID).val();

    if ( answer === "" ) errMsg = "Please provide an answer to submit.";
    else if( patternWord.test(answer) ) errMsg = "Answers can only contain letters.";
    else if( !patternMultiWord.test(answer) ) errMsg = "Please provide only one word.";
    return errMsg || false;
  };

  var send = function(){
    ansInput = $('#'+inputID);
    CC.answer = ansInput.val();
    now.distributeAnswer({ answer: CC.answer, qID: now.question.qID });
    ansInput.hide();    
  };

  return {
    displayFn: display,
    validFn: valid,
    sendFn: send
  }
};
RIPPLE.questionTypeBootstrap( RIPPLE.questionType['cloud'] );
