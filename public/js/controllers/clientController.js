/**
 * Client Plugin Session API Module. 
 *
 * @author William Myers
 * @class plugin-client.client
 * @title client
 * @space RIPPLE.questionType['<i>pluginName</i>'].client<br /> <span class="note"><i>pluginName</i> will be replaced by your plugin's name</span>
 */
RIPPLE.namespace('client');
// Set up session components
RIPPLE.client.validator = new ClientValidator();
RIPPLE.client.controller = new ClientController();
RIPPLE.activeController = "client";

function ClientController(){
	var that = this
    , VALID = RIPPLE.client.validator
		, notifyTimer = 0
    , notifySpeed = 250
    , controls = {}
    , announce = true
    , answer = ""
    , replace = true
    , displayAnswer = ''
    , sendBtn = $('#send-button');

	/**
	 * Clears previous question information
	 */
	this.clearQuestion = function(){
	  $('#question').html('<h2>Waiting for Question...</h2>');
	  $('#answer').html('');
	  $('#alert').html('');
	  $('#send-btn').hide();
    sendBtn.removeAttr('disabled').hide();
    // Close Growl
    $("div.jGrowl").jGrowl("close");
	}

	/**
	 * Show a Question that came from the presenter
	 * @param  {string} name [Type of question to show]
	 */
	this.showQuestion = function(name){
		var that = this
	  	, qOptionsHTML = ""
      , cnt=0;

	  // Compile Question Options
	  if( now.question != null){
      cnt++;
      var type = now.question.type;

      // Close Growl if open
      $("div.jGrowl").jGrowl("close");
      
	    // Show Question
	    $("#question").html(now.question.qTxt);
      
      // Close Chat for new question
      GLOBALS.jPM.close();

	    // Scroll to top to show new question
	    window.scrollTo(0, 0);

      // Remove data('disabled');
      $('#answer').removeData('disabled');

      // Check for Class, Methods, & Params
      /**
       * Hook fired when question is displayed to client
       *
       * @event displayFn
       */
      var passCheck = RIPPLE.checkClass(type, 'displayFn')
      if( !passCheck ) return false;

      // Display html of question
      RIPPLE.questionType[type].displayFn( now.question ); 

      // Move focus to input
      var firstInput = $('#answer input:first');
      if( firstInput.length ) firstInput.focus();


      // Android 2.x bug fix
      if(navigator.userAgent.match(/Android 2/)) { 
        var contentHeight = $(window).height() + $('#answer').height();
        $('body').css({'height':contentHeight}); 
      }  
	  }

	};

  this.sendInAnswer = function(elem, e){
    var type = now.question.type;

    that.answer = "";
    that.announce = true;
    that.replace = true;
    that.displayAnswer = "";

    isValid = VALID.answer( type );
    if( !isValid ) return false;

    // Check for Class, Methods, & Params
    var passCheck = RIPPLE.checkClass(type, 'sendFn')
    if( !passCheck ) return false;
    RIPPLE.questionType[type].sendFn(elem);

    // alert answer sent
    if( !that.replace && that.announce ) $.jGrowl( that.answerText(that.answer) );
    if( that.replace ) {
      var displayAnswer = that.displayAnswer || that.answer;
      $('#answer').html('<div class="well display-answer">Your answer was submitted as:<br /><span class="submitted-answer">' + displayAnswer + '</span>');
    }

    e.stopPropagation();
  };

  this.answerContent = function(html){
    return $('#answer').html(html);
  };
  this.alert = function(html){
    return $('#alert').html(html);
  }

  this.showAnswer = function(html){
    that.answerContent(html).show();
  }

  this.sendBtn = {
    show: function(){
      sendBtn.show();
    },

    disable: function(){
      sendBtn.prop("disabled", true);
    },

    enable: function(){
      sendBtn.prop("disabled", false);
    },

    hide: function(){
      sendBtn.hide();
    }
    
  };

  this.createSlider = function(){
    // load script
    if( $.data(document, "sliderScriptLoad") == undefined) {
      $.ajax({
        url: '/static/js?jquery-ui-1.9.1.slider.min.js&jquery.ui.touch-punch.min.js',
        dataType: "script",
        cache: true,
        error: function(e, jqxhr, settings, exception) {
          $.jGrowl("SYSTEM ERROR :: jQuery UI not loaded - " + jqxhr);
        },
        success: function(){
          // Used so that script is only pulled once
          $.data(document, "sliderScriptLoad", true);
          that.sliderLoad();
        }
      });
    } else that.sliderLoad();

    // add css
    $('head').append('<link rel="stylesheet" href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.9.1/themes/base/jquery-ui.css" type="text/css" />');      

  };

  this.sliderLoad = function(){
    var that = this;
    controls.slider = {};
    //Convert to usage associative array
    var qOptionsArr = now.question.qOptions;
    // Assign new array to current controller for use throughout script
    var qOptions = controls.slider.qOptions = that.convertQOptions(qOptionsArr);
    var submitOption = controls.slider.qOptions.submitOption;

    // Set min, max, and step
  	controls.slider.minScale = 0;
  	controls.slider.maxScale = (qOptions["scale"] != undefined) ? parseInt(qOptions["scale"]) : 10;
  	controls.slider.stepScale = 1;

    // Create the Slider
    $("#slider").slider({
      min: controls.slider.minScale,
      max: controls.slider.maxScale,
      step: controls.slider.stepScale,
      create: that.jqSliderCreate,
      slide: that.jqSliderMove
    });
    $('.ui-slider-handle').bind('click', function(){
        $(this).focus();
    });
  };

  this.jqSliderCreate = function(event, ui){
    var tickmarks = ["0","20","40","60","80", "100"]
      , tickDiv = '';
    for (var i = tickmarks.length - 1; i >= 0; i--) {
      var tickPercentage = parseInt(tickmarks[i]) / 100;
      tickValue = controls.slider.maxScale * tickPercentage;
      if( tickValue < 10 && tickValue != 0 ) tickClass = 'single-digit';
      else if( tickValue < 100) tickClass = 'double-digit';
      else if( tickValue < 1000) tickClass = 'triple-digit';
      else tickClass ='';
      
      var tickValueHtml = '<span class="tick-values ' + tickClass +'">' + tickValue + '</span>';
      tickDiv += '<span class="tickmark marker-' + tickmarks[i] + '" style="left:' + tickmarks[i] + '%;position:absolute;"> <span class="tick-pipe">|</span> <br />' + tickValueHtml + '</span>';
    }
    $("#slider").append("<div class='tickmark-wrap'>"+tickDiv+"</div>");    
  };

  this.jqSliderMove = function( event, ui ){
    var submitOption = controls.slider.qOptions.submitOption
      , send = false;

    // Create Tooltip
    $(this).find('.ui-slider-handle:last').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + ui.value + '</div></div>');
  
    // Determine Submit Type
    switch(submitOption){
      case 'continuous':
        that.jqSliderSendResponse( ui.value );
        break;
      case 'variable':
        that.jqSliderSendResponseDelay( ui.value, 500 );
        break;
    }
  };

  // Current not in use for stop event because mobile Android does not fire event!!!
  // May be able to implement at a later point
  // 
  // this.jqSliderStop = function( event, ui ) {
  //   console.log("[jqSliderStop] args", arguments);
  //   var submitOption = controls.slider.qOptions.submitOption
  //     , send = false;

  //   //alert("sent", ui.value);
  //   console.log(controls.slider);
  //   // alert(controls.slider)
  //   // Determine Submit Type
  //   switch(submitOption){
  //     case 'variable':
  //       send = true;
  //       break;
  //   }

  //   if(send) {
  //     that.jqSliderSendResponseDelay( ui.value );
  //   }
  // };

  this.jqSliderSendResponse = function(answer){
    var submitOption = controls.slider.qOptions.submitOption;

    $('#slide-value').html("You Answered: " + answer);
    now.distributeAnswer({ answer: answer, qID: now.question.qID });
    
    // Determin notification works based on submit type
    if( submitOption == 'variable') that.sliderSingleNotify(answer);
    else if ( submitOption == 'continuous') that.sliderContinuousNotify(answer);


  };

  this.jqSliderSendResponseDelay = function(answer, wait){
    var notifySpeed = wait || notifySpeed;
    // Clear Timer
    clearTimeout( notifyTimer );
    // Reset Timer
    notifyTimer = setTimeout( function(){
      that.jqSliderSendResponse(answer);
    }, notifySpeed);    
  };

  this.sliderSingleNotify = function(answer){
    $("div.jGrowl").jGrowl("close");
    $.jGrowl( that.answerText(answer), {
      beforeOpen: function(){
        $("div.jGrowl").find('div.jGrowl-notification').children().parent().remove();
      }
    });
  };

  this.sliderContinuousNotify = function(answer){
    var slider = $('#slider');
    if( slider.data('notify') != undefined && slider.data('notify') == 1 ) {
      $(".jGrowl-message").html("Sending... " + answer);
      clearTimeout( notifyTimer );
      closeSpeed = notifySpeed * 2;
      notifyTimer = setTimeout( function(){
        $.jGrowl("close");
      }, closeSpeed);
    } else {
      slider.data('notify',1);
      $.jGrowl("Sending... " + answer,{
        sticky: true,
        close: function() {
           slider.removeData('notify');
        }
      })
    }
  };

  this.createNumeric = function(){
    var that = this;
    controls.numeric = {};
    qOptions = that.convertQOptions( now.question.qOptions );

    // Create Select Options
    var inputOptions = '';

    // Define paramters
    var min = controls.numeric.min = (qOptions["min"] != undefined) ? parseFloat(qOptions["min"]) : 0;
    var max = controls.numeric.max = (qOptions["max"] != undefined && qOptions["max"] != "") ? parseFloat(qOptions["max"]) : 10;
    var step = controls.numeric.step = (qOptions["step"] != undefined) ? parseFloat(qOptions["step"]) : 1;

    // Create Control
    var inputControl = '<input id="numeric" name="numeric" type="number" pattern="\\d+(\\.\\d*)?" min="' + min + '" max="' + max + '" step="' + step + '" value=""></input>';
    inputControl += this.keypadHtml();

    var controlHtml = '<div id="numeric-wrap">' + inputControl + '</div>';

    return controlHtml;
  };

  this.keypadHtml = function(){
    var that = this
      , keypadHtml =""
      , tmpHtml = ""
      , keypadArray = []
      , corners = {
        "1": "btn-top-left",
        "3": "btn-top-right",
        ".": "btn-bottom-left",
        "CLR": "btn-bottom-right"
      }
      , rowEnd = [3,6,9];

    for (var i = 1; i < 10; i++) {
      var buttonCornerClass = ""
      , indexString = i.toString();

      // Added corner Classes
      if( corners[indexString] ) buttonCornerClass = corners[indexString];
      // Create buttons
      tmpHtml += that.keypadButtonHtml(i, buttonCornerClass);
      // Wrap if end of row
      if( rowEnd.indexOf(i) !== -1) {
        // Wrap row
        tmpHtml = that.keypadRowHtml(tmpHtml);
        // Amend to keypadHtml
        keypadHtml += tmpHtml;
        // Clear tmpHtml
        tmpHtml = "";
      }
    };

    // Create Bottom row
    tmpHtml = that.keypadButtonHtml(".",corners["."]) + that.keypadButtonHtml("0") + that.keypadButtonHtml("CLR", corners["CLR"]);
    tmpHtml = that.keypadRowHtml(tmpHtml);
    keypadHtml += tmpHtml;
    tmpHtml = ""

    // Wrap keypad div
    keypadHtml = "<div id='keypad'>" + keypadHtml + "</div>";

    return keypadHtml;
  };

  this.keypadButtonHtml = function(value, classes){
    classes = classes || "";
    if( !value ) return;
    var keyClass = ( value === "CLR" ) ? 'control-key' : 'key';

    return "<button class='span3 " + keyClass + " no-submit btn " + classes + "' tabindex='0'>" + value + "</button>";
  }

  this.keypadRowHtml = function(buttonHtml){
    return "<div class='row no-space'>" + buttonHtml + "</div>";
  }

  this.numericKeypadLoad = function(e){
    var numeric = $('#numeric');

    if(numeric.val() == null) numeric.val("");
     $('.key').on('click keypress', function(e){
      if( !isKeypressEnter(e) ) return;
      
      var inputValue = ( numeric.val() ==="" && $(this).html() === "." ) ? "0." : this.innerHTML
      numeric.val( numeric.val() + inputValue ).focus();
      e.preventDefault();
    });
    
    $('.control-key').on('click keypress', function(e){
      if( !isKeypressEnter(e) ) return;
      numeric.val("");
      e.preventDefault();
    });
  }

  this.answerText = function(answer){
    return '<div class="answer-sent"><i class="icon-ok-sign"></i> Answer Sent :: ' + answer + '</div>'
  }

  this.alignMCText = function(){
    $('#answer .text-wrap').each(function(){
      if( $(window).width() > 400 ) {
        var parentWidth = $(this).parent().width()
          , buttonWidth = $(this).siblings('.input-full-height').width()
          , txtLeftPadding = 20
          , txtWidth = parentWidth - ( buttonWidth + txtLeftPadding +5)
          , txtTopPadding = 0;
      } else {
        var txtWidth = '100%'
          , txtLeftPadding = 0
          , txtTopPadding = '1em';
      }

      $(this).css({
        'width':txtWidth,
        'padding-left':txtLeftPadding,
        'padding-top':txtTopPadding
      });
    });

    $('#answer .input-full-height').each(function(){
      var button = $(this).find('input');
      if( $(window).width() > 400 ) {
        var parentHeight = $(this).parent().height()
          , buttonHeight = button.height()
          , topMargin = -( (parentHeight - buttonHeight) -20);

      } else {
        topMargin = 0;
      }
      button.css({
        'margin-top':topMargin,
        'margin-bottom':-topMargin
      });

    })
  };

  this.buttonAnswerDistribute = function(elem){
    var parent = $(elem).parent()
      , container = $('#answer')
      , display = "";

    // If well is disabled exit function
    if( container.data('disabled') === true) {
      that.announce = false;
      return;
    }

    // Determine if it is a button click or a click inside the well
    if( parent.hasClass('buttonAnswers') ){
      // Was well click
      var button = $(elem).find(":input[type='button']");
      that.answer = button.val();
      $(elem).addClass("highlight");
      display = $(elem).find('.text-wrap').html();
    } else{
      // Was button click
      that.answer = $(elem).val();
      $(elem).closest('.button-answer').addClass("highlight"); 
      display = $(elem).closest('.button-answer').find('.text-wrap').html(); 
    }

    // Disable Buttons & further clicks
    container.data('disabled', true);
    container.find('input').attr('disabled', 'disabled');
    
    now.distributeAnswer({ answer: that.answer, qID: now.question.qID });

    return display;
 
  };
}

ClientController.prototype.convertQOptions = function(qOptionsArr){
  var qOptions = {};

  //Change to associative array for easy use
  for (var i = 0; i < qOptionsArr.length; i++) {
    var optionName = qOptionsArr[i].name;
    var optionValue = qOptionsArr[i].value;
    qOptions[optionName] = optionValue;
  };

  return qOptions;
};
