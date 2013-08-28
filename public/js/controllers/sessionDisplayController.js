/**
 * Modifies the Admin Display
 *
 * @author William Myers
 */
function SessionDisplayController () {
  var that = this
    , qOptions = $('#qOptions')
    , qOptionsArrow = $('#qOption-chevron')
    , closeConfirm, reloadConfirm;

  /**
   * Puts sting in display
   * 
   * @param  {string} output [String to be put into elem]
   * @param  {string} elem [Element to put string into]
   */
  this.update = function(output,elemID){
    $(elemID).html(output);
  }

  this.append = function(output,elemID){
    $(elemID).append(output);
  }

  this.returnOptions = function(output){
    that.update(output, '#qOptions');
  }

  this.answers = function(output){
    that.update(output, '#answers');
  }
  this.answersAppend = function(output){
    that.append(output,'#answers');
  }

  this.responses = function(output){
    that.update(output, '#responses');
  }
  this.responsesAppend = function(output){
    that.append(output, '#responses');
  }

  this.total = function(output){
    that.update(output, '#total');
  }

  this.flashDisplay = function(output){
    that.update(output, '#flash-display');
  }

  this.createFlashBtn = function(){
    var output = "";
    output += '<button id="flash-show" class="btn btn-primary">Show Answers</button>';
    output += '<button id="flash-hide" class="btn btn-inverse">Hide Answers</button>';
    output = '<div id="flash-btn-wrap">' + output + '</div>';
    return output;
  }

  this.createFlashDiv = function(){
    return '<div id="flash-display"></div>';
  }

  this.createFlashAns = function(answer){
    var removeIcon = '<i class="icon icon-remove-circle remove-response" tabindex="0"></i>'
      , removeWrap = '<span class="pull-right"><a href="#" class="remove-response-wrap" title="Remove" data-placement="left">' + removeIcon + '</a></span>'
      , inner = removeWrap + answer;
    return '<p class="flashwell well-small">' + inner + '</p>';
  }

  this.createAnsPlaceholder = function(){
    return "<div id='answer-placeholder'></div>";
  }
  /**
   * Increment Value of badges
   * 
   * @param  {string} objID  [Element ID name w/out #]
   * @param  {object} ansObj [Object containing all the answer values]
   * @return {numeric} val   [The new value of the answer]
   */
  this.incrementVal = function(objID, value){
    value++;
    $('#'+objID).text(value);
    return value;
  }

  /**
   * Creates the Progress Bar for Multiple Choice and True / False
   * 
   * @param  {string} barName [The specific name to ammend to identify this bar]
   * @return {string} html    [The html for a progress bar]
   */
  this.createProgressBar = function(barName){    
    // Create html for Progression bar
    var html = '<div id="answer' + barName + '-label"></div>';
    html += '<div class="ui-progress-bar ui-container">' +
      '<div id="bar' + barName + '" class="ui-progress" style="width: 5px;">' +
      '<span class="ui-label" style="display:none;">' + barName + ' <span class="progress-value">0%</span></span>' +
      '</div><!-- .ui-progress --></div><!-- progress_bar -->';
    return html;
  }

  /**
   * Adjust the Progress Bar in value and change display
   * 
   * @param  {string} objID  [Element ID name w/out #]
   * @param  {object} ansObj [Object containing all the answer values]
   */
  this.adjProgressBar = function(objID, ansObj, total){
    console.info("adjProgressBar args :: ",arguments);
    $.each(ansObj, function(key, value){
      if( value != 0){
        var percentStr = 0;
        // Calc Percentage to 2 decimal places
        percent = ( ( parseInt(value) / parseInt( total ) ) * 100 ).toFixed(2);
        if( percent != 0 ){
          // Strip out trailing zeros
          percentStr = percent.toString().replace(/0+$/, "");

          // Strip out following decimal w/ 00
          percentStr = percentStr.replace(/.$/, ""); 

          // Animate progress bar
          $('#bar' + key).stop().animate({width: percent+'%'}, 1000);

        } 

        // Show Label for Responses
        if( percent != 0 ){
          if( percent > 15 ){
            $('#bar' + key + ' .ui-label').fadeIn().find('.progress-value').html(percentStr + "%");
          } else $('#bar' + key + ' .ui-label').hide();
        } 
      }
    })
  }

  /**
   * Clears the Progress Bar
   */
  this.clearProgressBar = function(){
    if( $('#answers .ui-progress').length ) $('#answers .ui-progress').css('width', '5px');
  }

  /**
   * Adds Answer Values to Progress Bars
   * 
   * @param  {object} ansObj [Object containing all the answer values]
   */
  this.addAnswerToBars = function(ansObj){
    var ansVals = ["A", "B", "C", "D", "E"];
    $.each(ansVals, function(k, v){
      var answerOpt = String( $("#question-" + v).val() ).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
      $("#answer" + v + "-label").text( answerOpt );
    })
  }
  
  this.createScaleSet = function(min,max){
    var checked = ( max == 10 ) ? "checked" : "";
    var html = "<div class='scale-values'><input type='radio' name='scale' value='" + max + "' " + checked + "> " + min + " to " + max + "</div>";
    return html
  }

  this.createSliderSubmitOptions = function(index, value, label, hint){
    var checked = ( index == 1 ) ? "checked" : "";
    hintHtml = !hint ? "" : GLOBALS.createHint(hint);
    var html = "<div class='submit-values'><input type='radio' name='submitOption' id='submitOption" + index + "' value='" + value + "' " + checked + "/> " + label + hintHtml + "</div>";
    return html;
  }

  /**
   * Creation of Question Response Area
   * @param  {string} questionName [The specifc name of question]
   * @return {string} html        
   */
  this.createQuestionArea = function(questionName){    
    // Create html for question area
    var html = "<div class='row answer-row'> <div class='span2'> " + questionName + " - </div><input type='textbox' id='question-" + 
      questionName + "' name='question-" + questionName + "' value=''/>" +
      " <span id='" + questionName + "' class='tally label label-info'></span> </div>";
    return html;
  }

  this.createTxtInput = function(inputID, inputLabel, defaultValue){ 
    // Check arguments
    isIDString = GLOBALS.isString(inputID);
    if( !isIDString ) 
      console.error("createTxtInput arg #1 - inputID is not a string");
    isTitleString = GLOBALS.isString( inputLabel)
    if( !isTitleString ) 
      console.error("createTxtInput arg #2 -  inputLabel is not a string");

    defaultValue = defaultValue || "";   
    // Create html for question area
    var html = "<div class='row answer-row'>"; 
        html += "<div class='span2'> <label for='" + inputID + "'/>" +  inputLabel + "</lable></div>";
        html += "<input type='textbox' id='" + inputID + "' name='" + inputID + "' value='" + defaultValue + "'/>";
        html += "</div>";
    return html;
  }

  this.graphHtml = function(){
      var outputAns ='<div id="graphWrap" style="width:100%;height:320px"></div>';
      that.answers(outputAns);    
  }

  /**
   * Clear the UI between questions
   */
  this.reset = function(status){  
    var that = this;

    // Get the type of current question
    var type = $('#type').val()
      , qTypeClass = RIPPLE.questionType[type];
    // Clear Areas and Data
    if( status === 'wipe' ) {
      that.returnOptions('');
      that.qOptionToggle('open');
    } else if( status === 'clear' ) {
      $('#qOptions .tally').html("");
    }
    that.responses('');
    that.total('0');
    if( status !== 'clear') $('#qTxt').data("wysihtml5").editor.setValue("");

    // Check for Class, Methods, & Params
    var passCheck = RIPPLE.checkClass(type); 
    var hasClearFn = qTypeClass.hasOwnProperty('displayResetFn');
    if( passCheck && hasClearFn ) qTypeClass.displayResetFn();   

  };

  this.fillOptions = function(qArray){
    var type = qArray['type'];
    if( qArray.hasOwnProperty('qTxt') && qArray['qTxt'].length) $('#qTxt').data("wysihtml5").editor.setValue( qArray['qTxt'] );

    //Check for Options
    if( !qArray.hasOwnProperty('qOptions') ) return false;

    // Check for Class, Methods, & Params
    var passCheck = RIPPLE.checkClass(type);    
    if( !passCheck ) return false;

    var hasOptionsFn = RIPPLE.questionType[type].hasOwnProperty('fillOptionsFn');
    if( hasOptionsFn ) RIPPLE.questionType[type].fillOptionsFn(qArray);

  };

  this.updateIndResp = function(name,answer){
    $('#responses').append("<span class='badge badge-inverse'>A:</span> <span class='name'>" + name + " - </span>" + answer + "<br />");
  };

  this.qOptionToggle = function(status){
    var that = this;

    switch(status){
      case 'toggle':
        if( qOptionsArrow.hasClass('icon-chevron-down') ) that.qOptionClose();
        else if ( qOptionsArrow.hasClass('icon-chevron-right') ) that.qOptionOpen();
        break;
      case 'open':
        that.qOptionOpen();
        break;
      case 'close':
        that.qOptionClose();
        break;
    }
  };

  this.qOptionClose = function(){
    qOptions.hide();
    qOptionsArrow.removeClass("icon-chevron-down").addClass('icon-chevron-right');
  };

  this.qOptionOpen = function(){
    qOptions.show();
    qOptionsArrow.removeClass("icon-chevron-right").addClass('icon-chevron-down');
  }

  this.answerOptionDisplay = function(status){
    var answerOption = $('#question-wrap .answer-options')
      , display = status || false;

    display == true ? answerOption.show() : answerOption.hide();    
  };

  this.confirmClose = function(){
    var comfirmClass = 'confirm-close';

    var buildPrompt = function(){
      closeConfirm = new SessionDisplayController.prototype.buildConfirm(comfirmClass);
      closeConfirm.modal({ show : false, keyboard : true, backdrop : 'static' });       
      closeConfirm.find('.modal-header h3').text('End Session');
      closeConfirm.find('.modal-body p')
        .html("Are you sure that you would like to end your session?");
      closeConfirm.find('button.submit')
        .text(' End Session ')
        .addClass('btn-danger')
        .click(function(){
          now.distributeStopSession();
          window.location.href = '/admin/session/close';
        })
    };

    if( !$('.'+comfirmClass).length > 0 ) buildPrompt();
    closeConfirm.modal("show");
  };

  this.reloadPrompt = function(){
    var comfirmClass = 'reload-prompt';

    var buildPrompt = function(){
      reloadConfirm = new SessionDisplayController.prototype.buildConfirm(comfirmClass);
      reloadConfirm.modal({ show : false, keyboard : true, backdrop : 'static' });
      reloadConfirm.find('.modal-header h3').text('Continue Session?');
      reloadConfirm.find('.modal-body p')
        .html("An earlier session was already opened. Do you want to continue with previous session?");
      reloadConfirm.find('button.submit')
        .text('Continue')
        .addClass('btn-primary')
        .click(function(){
          reloadConfirm.modal('hide');
        });
      reloadConfirm.find('button.cancel')
        .text('Start New')
        .click(function(){
          window.location.href = '/admin/session/close?reload='+window.location.pathname
        });
    }    

    if( !$('.'+comfirmClass).length > 0 ) buildPrompt();
    reloadConfirm.modal("show");
  };

};

SessionDisplayController.prototype.showRoomFullscreen = function(msg, header){
  $('.modal-fullscreen').modal({ show : false, keyboard : false, backdrop : 'static' });        
  $('.modal-fullscreen .modal-header h3').html("&nbsp;");
  $('.modal-fullscreen .modal-body p').html(msg);
  $('.modal-fullscreen').modal('show');
  $('.modal-full-wrap').focus();
};

SessionDisplayController.prototype.buildConfirm = function(className){
  return $('.modal-confirm').clone().prependTo('body').removeClass('modal-confirm').addClass(className);
};
