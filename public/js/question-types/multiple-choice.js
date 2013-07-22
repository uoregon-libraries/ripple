//RIPPLE.questionType.namespace('multiple-choice');
RIPPLE.questionType['multiple-choice'] = {}; 
RIPPLE.questionType['multiple-choice'].params = {
  ansVals:["A", "B", "C", "D", "E"]
}
RIPPLE.questionType['multiple-choice'].session = function(){
  var DISPLAY = RIPPLE.session.displayController
  , ASC = RIPPLE.session.mainController 
  , ansVals = RIPPLE.questionType['multiple-choice'].params.ansVals
  , ansObj = {}
  , resetObj = {"A":0,"B":0,"C":0,"D":0,"E":0};

  var display = function (){

    _resetObj();

    // Set initial options to blank
    var outputOptions = "",
      outputAns = "";

    // Create a question area & progress bar for each
    for(var i=0; i < ansVals.length; i++){
      outputOptions += DISPLAY.createQuestionArea(ansVals[i]);
      outputAns += DISPLAY.createProgressBar(ansVals[i]);
    }
    outputOptions = "<div class='well'>" + outputOptions + "<i class='small-print'>Blank answer options will not be sent.</i></div>";

    // Update the UI with html for each area
    DISPLAY.returnOptions(outputOptions);
    DISPLAY.answers(outputAns);

    DISPLAY.clearProgressBar();
  }

  var fillOptions = function(qArray){
    for (var i = ansVals.length - 1; i >= 0; i--) {
      var letter = ansVals[i];
      if( qArray['qOptions'].hasOwnProperty(letter) 
          && qArray['qOptions'][letter].length ) $('#question-'+letter).val(qArray['qOptions'][letter]);
    };
  }

  var _resetObj = function(){
    // Reset ansObj
    ansObj = GLOBALS.cloneObj(resetObj);
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
    newTotal = DISPLAY.incrementVal("total", total);
    ASC.params('total', newTotal);

    // Increment and Set Answer
    ansObj[answer] = DISPLAY.incrementVal(answer, ansObj[answer]);

    // Only regraph if an answer has not come in for 500ms

    if( timer.length ) clearTimeout(timer);
    newTimer = setTimeout(function(){
      DISPLAY.adjProgressBar(answer, ansObj, newTotal);
    }, 500);
    ASC.params("timer", newTimer);

    // Show Response
    DISPLAY.updateIndResp(name,answer);
  }

  var clearAnsVals = function(){
    _resetObj();
  }

  var displayReset = function(){
    DISPLAY.clearProgressBar();
  }

  return {
    displayQuestionFn: display,
    displayOptions: true,
    fillOptionsFn: fillOptions, 
    sendQuestionFn: send, 
    recieveAnswerFn: recAns,
    clearAnsValsFn: clearAnsVals,
    displayResetFn: displayReset      
  }
};

RIPPLE.questionType['multiple-choice'].set = function(){
  var SC = RIPPLE.set.controller
  , ansVals = RIPPLE.questionType['multiple-choice'].params.ansVals
  , newQuestionEven = 0;

  var displaySetEdit = function(qTxt, qOptions){
    // Answers that are allowed
    var ansOptions = ""
      , qNumTotal = SC.params("qNumTotal");

    newQuestionEven = 0;
    // Create a question area & progress bar for each
    for(var i=0, len = ansVals.length; i < len ; i++){
      var letter = ansVals[i];
      optionVal = ( qOptions && qOptions[letter] ) ? qOptions[letter] : ""
      ansOptions += _createQuestionArea(letter, qNumTotal, i, optionVal);

      // Toggle Control 
      newQuestionEven = ( newQuestionEven === 0 ) ? 1 : 0 ;
    }

    return (newQuestionEven == 1) ? ansOptions + '</div>' : ansOptions;
  };

  _createQuestionArea = function(qName, qNum, index,  value ){
    var html = ""
      , label = "Write answer here..."
      , value = value || "";

    html = "<div class='span1'></div><div class='span5'>";
    html += "<label  class='label-highlight letter-highlight'>" + qName + ": </label>";
    html += "<span>"
    html += "<a href='#' id='answer-" + qName + "-" + qNum + "' class='editable' data-name='" + qName + "' data-emptytext='" + label + "'>" + value + "</a>";
    html += "</div>";

    // Add in rows
    html = (newQuestionEven == 0) ? "<div class='row'>" + html : html + "</div>"

    return html;
  }

  return {
    displaySetEditFn: displaySetEdit
  }
};

RIPPLE.questionType['multiple-choice'].client = function(){
  var CC = RIPPLE.client.controller;

  var display = function(){
    var qOptionCum ="";
    // Determine how many choices to display
    var qOptionsArr = now.question.qOptions;
    for (var i = 0; i < qOptionsArr.length; i++) {
      var optionName = qOptionsArr[i].name
        , optionValue = qOptionsArr[i].value;

      // Trim Whitespace
      optionValue = $.trim(optionValue);

      // Create Question Types
      if( optionValue !== ""){
        rspValue = optionName.substr(optionName.length - 1,1);
        qOptionsInsert = "<li class='button-answer well'><div class='input-full-height'><input type='button' name='" + optionName + "' id='" + optionName + "'";
        qOptionsInsert += "value='" + rspValue + "' data-ref='" + optionValue + "' class='btn btn-primary mc-btn'/></div><div class='text-wrap'>" + optionValue + "</div></li>";
        qOptionCum += qOptionsInsert;
      }
    }
    // Add wrapper
    var html = "<ul id='multiple-choice' class='buttonAnswers'>" + qOptionCum + "</ul>";
    CC.showAnswer(html);
    CC.alignMCText();
  };

  var send = function(elem){
    displayTxt = CC.buttonAnswerDistribute(elem);
    if( displayTxt !== "" ) CC.displayAnswer = CC.answer + ' - ' +  displayTxt;    
  };

  var resize = function(){
    CC.alignMCText();  
  };

  return {
    displayFn: display,
    sendFn: send,
    resizeFn: resize
  }
};

RIPPLE.questionTypeBootstrap( RIPPLE.questionType['multiple-choice'] );