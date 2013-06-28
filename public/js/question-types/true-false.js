RIPPLE.questionType['true-false'] = {};

RIPPLE.questionType['true-false'].session = function(){
  var DISPLAY = RIPPLE.session.displayController
  , ASC = RIPPLE.session.mainController
  , ansObj = {}
  , initialObj = {"True":0,"False":0};

  var display = function (){
    _resetObj();

    // html for True / False
    var outputOptions = 
      "True - <span id='True' class='tally label label-info'></span> <br />";
      outputOptions += "False - <span id='False' class='tally label label-info'></span> <br/>";
      outputOptions = "<div class='well'>" + outputOptions + "</div>";

    DISPLAY.returnOptions(outputOptions);
    
    // Create Progress Bars and answer html
    var outputAns = DISPLAY.createProgressBar("True");
    outputAns += DISPLAY.createProgressBar("False");
    DISPLAY.answers(outputAns);

    DISPLAY.clearProgressBar();
  }

  var _resetObj = function(){
    // Reset ansObj
    ansObj = GLOBALS.cloneObj(initialObj);
  }

  var send = function(){
    _resetObj();
    DISPLAY.addAnswerToBars(ansObj);
    DISPLAY.clearProgressBar();
  }

  var recAns = function(clientID, name, answer){
    // console.info("recAns args :: ",arguments);
    var type = now.question.type
      , timer = ASC.params("timer")
      , total = ASC.params("total");

    // Increment Total
    newTotal = ASC.incrementTotal();

    // Increment and Set Answer
    ansObj[answer] = DISPLAY.incrementVal(answer, ansObj[answer]);

    // Only regraph if an answer has not come in for 500ms

    if( timer.length ) clearTimeout(timer);
    newTimer = setTimeout(function(){
      console.log(ansObj);
      DISPLAY.adjProgressBar(answer, ansObj, newTotal);
    }, 500);
    ASC.params("timer", newTimer);

    // Show Response
    DISPLAY.updateIndResp(name,answer);
  };

  var clearAnsVals = function(){
    _resetObj();
  }

  var displayReset = function(){
    DISPLAY.clearProgressBar();
  }
  
  return {
    displayQuestionFn: display,
    displayOptions: false,
    sendQuestionFn: send,
    recieveAnswerFn: recAns,
    clearAnsValsFn: clearAnsVals,
    displayResetFn: displayReset
  }

};

RIPPLE.questionType['true-false'].client = function(){
  var CC = RIPPLE.client.controller;

  var display = function(){
    // Create html
    var qOptionsInsert = "<li class='well button-answer'><div class='true-btn-wrap'><input type='button' name='T' id='T' value='True' data-ref='True' class='btn btn-primary'/></div></li>";
    qOptionsInsert += "<li class='well button-answer'><div class='true-btn-wrap'><input type='button' name='F' id='F' value='False' data-ref='True' class='btn btn-primary'/></div></li>";
    var html = "<ul id='true-false' class='buttonAnswers'>" + qOptionsInsert + "</ul>";
    CC.showAnswer(html);
  };

  var send = function(elem){
    CC.buttonAnswerDistribute(elem);
  };

  return {
    displayFn: display,
    sendFn: send
  }
};

RIPPLE.questionTypeBootstrap( RIPPLE.questionType['true-false'] );