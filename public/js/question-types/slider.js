RIPPLE.questionType['slider'] = {
  params:{
    multipleResponseHint: " Answers are submitted each time the slider is released. ",
    continuousHint: " Answers are submitted continuously as slider is moved. "
  }
};

/**
 * Session UI Related functionality
 * @return object Methods and parameters that will be called on the Session UI
 *   for Slider Question Type
 */
RIPPLE.questionType['slider'].session = function(){
  var DISPLAY = RIPPLE.session.displayController
    , ASC = RIPPLE.session.mainController
    , ansObj = {};

  var display = function (){

      _resetObj();

      // Generate Graph Shell Html
      DISPLAY.graphHtml();

      // Create answer options sets
      var radioControls = DISPLAY.createScaleSet("0","5") + DISPLAY.createScaleSet("0","10") + DISPLAY.createScaleSet("0","50") + DISPLAY.createScaleSet("0","100");
        // Currently removed from the Admin UI because of UX considerations but may be reinstated later
      //var stepControl = "<div>Interval between Numbers: <input type='number' name='step' id='dial-step' value='1'  min='1' max='10'/></div>";
      var stepControl = ""
      var scaleFormGroup = "<fieldset><legend>Scale</legend>" + radioControls + stepControl + "</fieldset>";
      // Create sumbit Options 
      var submitControl = DISPLAY.createSliderSubmitOptions(1, "variable", "Multiple Response", RIPPLE.questionType['slider'].params.multipleResponseHint) + DISPLAY.createSliderSubmitOptions(2, "continuous", "Continuous Response", RIPPLE.questionType['slider'].params.continuousHint);
      var submitOptions = "<fieldset><legend>Submit</legend>" + submitControl + "</fieldset>";
      var outputAns  = "<div class='well'>" + scaleFormGroup  + submitOptions +"</div>";
      
      DISPLAY.returnOptions(outputAns);    
      
      _generateGraph();

      // Bug Fix where graph doesn't load correctly initially if 
      // first question in set
      setTimeout(function(){
        console.log( ASC.params('graph').instance );
        ASC.params('graph').instance.resizeHandler_();
      }, 500);
    }

    var _resetObj = function(){
      ansObj = {};
      ansObj.data = [[0]];
      ansObj.users = {};
      ansObj.usersCount = 0;
      ansObj.labels = ['Time'];
      ansObj.clock = 0;
      ASC.params('graph',{});
    };

    var _generateGraph = function(){
      var maxInput = $('#qOptions input[name="scale"]:checked')
        , maxValue = parseInt( maxInput.val() ) * 1.1
        , graph = ASC.params('graph');
      console.log( maxInput );
      // Create the initial graph
      graph.instance = new Dygraph(
        document.getElementById("graphWrap"), 
        ansObj.data,
        {
          drawPoints: true,
          valueRange: [0, maxValue],
          labels: ['Time'],
          gridLineColor: '#AAAAAA',
          title: 'Responses',
          xlabel: 'Time (s)',
          ylabel: 'Scale',
          legend: 'never',
          axes: {
            x : {
              valueFormatter : function(x, opts, series_name, dg){
                return '<strong>' + x + 's </strong>';
              }
            }
          },
          showLabelsOnHighlight: false,
          highlightSeriesOpts: {strokeWidth: 3, strokeBorderWidth: 1, highlightCircleSize: 5},
          showRangeSelector: true,
          highlightCallback: function(e, x, pts) {
            // Create Header
            DISPLAY.responses( '<h3>Elapsed Time - ' + x + ' seconds </h3>' );

            // that individual points
            for (var i = 0; i < pts.length; i++) {
              var p = pts[i];
              value = p.yval == undefined ? false : p.yval;
              // if( value !== false ) output += p.name + ": " + value + "<br />";
              if( value !== false ) DISPLAY.updateIndResp(p.name, value);
            }

            // Put Output in #responses div
            // DISPLAY.responses(output);

            // Refine Legend display info
            
          },
          unhighlightCallback: function() {
            // Clear Individual Responses
            //that.responses('');
          }
        }
      );   
    };

    var fillOptions = function(qArray){
      for( x in qArray.qOptions ){
        console.log("Slider qOption " + x, qArray.qOptions[x]);
        if( x === 'scale') {
          var input = $("#qOptions input[name='" + x + "'][value=" + qArray.qOptions[x] + "]");
          input.prop("checked", true);
        }
       if( x === 'submitOption') {
          var input = $("#qOptions input[name='" + x + "'][value=" + qArray.qOptions[x] + "]");
          input.prop("checked", true);
        }
      };
    };

    var send = function(){
      _resetObj();
      ASC.clearGraphInterval();
      _generateGraph();
    };

    var recAns = function(clientID, name, answer){
      var t = new Date()
        , graph = ASC.params('graph');

      if( !ansObj.users.hasOwnProperty( clientID ) ) {
        // Increment the User Counter
        ansObj.usersCount++
        ansObj.users[clientID] = ansObj.usersCount;

        // Update Labels
        ansObj.labels.push(name);
        graph.instance.updateOptions( { 'labels': ansObj.labels } );

        // Update Initial Array
        ansObj.data[0].push(0);

        // Update data
        var userIndex = parseInt(ansObj.users[clientID]);
        var dataIndex = parseInt(ansObj.data.length -1);
          
        // Put Current Answer in the last data array in correct position
        ansObj.data[dataIndex][userIndex] = answer;


        // Start the Interval after the first responder connects
        if( !ASC.params('firstSet') ) {
          ASC.startGraphing(ansObj);
          // Allow Interval to only be sent once
          ASC.params('firstSet', true);
        } 

        // Increment Total Response
        ASC.incrementTotal();

      } else {
        // Update data
        var userIndex = parseInt(ansObj.users[clientID]);
        var dataIndex = parseInt(ansObj.data.length -1);

        // Put Current Answer in the last data array in correct position
        ansObj.data[dataIndex][userIndex] = answer;
      }      
    };

    var resizeAnswers = function(){
      if( ASC.params('graph').instance.hasOwnProperty('resizeHandler_') ) ASC.params('graph').instance.resizeHandler_();
    };

    var displayReset = function(){
      DISPLAY.graphHtml();
    };

    var getAnsObj = function(){
      return ansObj;
    }

  return {
    displayQuestionFn: display,
    displayOptions: true,
    fillOptionsFn: fillOptions,
    sendQuestionFn: send,
    recieveAnswerFn: recAns,
    resizeAnswersFn: resizeAnswers,
    displayResetFn: displayReset,
    getAnswerObjectFn: getAnsObj
  }
};

/**
 * Set Edit UI Related Functionality
 * @return object Methods and parameters that will be called on the Set Edit UI
 *   for Slider Question Type
 */
RIPPLE.questionType['slider'].set = function(){
  var SC = RIPPLE.set.controller
    , maxValues = [100, 50, 10, 5]
    , submitTypes = [
        {value:'continuous', title:'Continuous Response'},
        {value:'variable',title:'Multiple Response'}
      ]
    , scaleSelect, submitSelect;

  init = function(){
    var scaleValueArray = []
      , submitValueArray = [];

    // Generate Scale Select Values in String format for x-editable
    for (var i = maxValues.length - 1; i >= 0; i--) {
      var max = maxValues[i]
        , maxTxt = "0 to " + max

      scaleValueArray.push({value:String(max), text:maxTxt })
    };    
    scaleSelect = JSON.stringify(scaleValueArray);

    // Generate Submit Select Values in String format for x-editable
    for (var i = submitTypes.length - 1; i >= 0; i--) {
      var value = submitTypes[i].value
        , title = submitTypes[i].title;

      submitValueArray.push({value:value, text:title});
    };
    submitSelect = JSON.stringify(submitValueArray);
  }();

  var displaySetEdit = function(qTxt, qOptions){
    var scale
      , submitOption = ""
      , outputControls = ""
      , outputControls2 = "";

    // Set qOptions from db
    if( typeof qOptions !== "undefined" ) {
      if( qOptions.hasOwnProperty("scale") ) {
        scale = qOptions.scale;
        scaleTxt = "0 to " + scale;
      } else scaleTxt = "";
      if( qOptions.hasOwnProperty("submitOption") ) submitOption = qOptions.submitOption;
    }

    // Scale Options Inputs
    outputControls = "<label class='lead-label'>Scale:</label>";
    outputControls += "<a href='#' data-name='scale' class='editable' data-type='select' data-source='" + scaleSelect + "' data-value='" + scale + "' data-emptytext='Select Scale [Default: 0 to 10]' data-showbuttons='false'></a>"; 
    outputControls = "<div>" + outputControls + "</div>";
    // outputControls += "<input type='radio' name='scale' value='" + max + "' data-dbkey='qOptions' data-dbOptionIndex='scale'" + checked + ">";
    // outputControls += "0 to " + max;
    //outputControls = "<div class='scale-values'>" + outputControls + "</div>";

    // // Generate Submission Type Controls
    // for (var i = submitTypes.length - 1; i >= 0; i--) {
    //   var checked = "";
    //   if( submitOption !== ""){
    //     if( submitOption === submitTypes[i].value) checked = "checked";
    //   } else {
    //     if( submitTypes[i].value === 'variable') checked = "checked";
    //   }         

    //   // outputControls2 += "<div><input type='radio' name='submitOption' id='submitOption' data-dbkey='qOptions' data-dbOptionIndex='submitOption' " + i + " value='" + submitTypes[i].value + "' " + checked + "> " + submitTypes[i].title + "</div>";
    // };
    
    // Submit Options Inputs
    var hint = "";
    hint += submitTypes[1]['title'] + " - " + RIPPLE.questionType['slider'].params.multipleResponseHint;
    hint += submitTypes[0]['title'] + " - " + RIPPLE.questionType['slider'].params.continuousHint;
    outputControls2 += "<label class='lead-label'>Submit Option:</label>"
    outputControls2 += "<a href='#' data-name='submitOption' class='editable' data-type='select' data-value='" + submitOption + "' data-source='"+ submitSelect + "' data-emptytext='Select Submit Options [Default: Multiple Responses]' data-showbuttons='false'></a>";
    outputControls += "<div>" + outputControls2 + " " + GLOBALS.createHint( hint ) + "</div>";
    // Wrapper
    outputControls = "<div class='controls slider-options'>" + outputControls +'</div>';

    return outputControls;
  };

  return {
    displaySetEditFn: displaySetEdit
  }
};

/**
 * Client UI Related Functionality
 * @return object Methods and parameters that will be called on the Client UI
 *   for Slider Question Type
 */
RIPPLE.questionType['slider'].client = function(){
  var CC = RIPPLE.client.controller;

  var display = function(){
    // Create Dial html
    var html = '<div id="slide-value" class="well well-small">Slide the indicator to send an answer in.</div>';
    var qOptionsSlider = '<div id="slider"><div class=" class="loader"></div></div>';  
    qOptionsSlider = '<div id="slider-wrap">' + qOptionsSlider + '</div>';
    html += qOptionsSlider; 
    CC.showAnswer(html);
    CC.createSlider();
  };

  var send = function(){
    
  };

  return {
    displayFn: display,
    sendFn: send
  }
};
  
RIPPLE.questionTypeBootstrap( RIPPLE.questionType['slider'] );