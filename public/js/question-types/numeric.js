RIPPLE.questionType['numeric'] = {};

RIPPLE.questionType['numeric'].session = function(){
  var DISPLAY = RIPPLE.session.displayController
    , ASC = RIPPLE.session.mainController
    , ansObj = {};

  var display = function (){

    _resetObj();

    // Generate Graph Shell Html
    DISPLAY.graphHtml();

    // Create Controls
    var controls = '<label for="min">Minimum: </label><input id="min" name="min" type="number" value="0"/><br />';
    controls += '<label for="max">Maximum: </label><input id="max" name="max" type="number" value="10" max="100"/><br />'
    controls += '<label for="step">Interval between Numbers: </label><input id="step" name="step" type="number" value="1" min="0" max="10" /><br />'
    var output = '<div class="well numeric-options">' + controls + '</div>';
    DISPLAY.returnOptions(output); 

    _generateGraph();
  }

  var _resetObj = function(){
    ansObj = {}
    ansObj.data = [];
    ansObj.users = {};
    ansObj.usersCount = 0;
    ansObj.labels = ['Time'];
    ansObj.clock = 0;
    ASC.params('graph',{});
  };

  var _generateGraph = function(){
    var graph = ASC.params('graph');
    // Turn associative array into 2D array
    var min = parseInt($("input#min").val())
      , max = parseInt($("input#max").val())
      , step = parseInt($("#step").val());
    if( min !== 0 ) {
      min = min - 1;
      data = [[min, 0]];
      //ansObj.numeric.data[ String(min) ] = 0;
    } else data = [[-1,0]]
    // Graph Options
    var graphOptions =       {
      labels: ["Value", "Responses"],
      title: 'Responses',
      xlabel: 'Numeric Values',
      ylabel: 'Number of Responses',
      dateWindow: [min, max],
      includeZero: true,
      axes: {
        x : {
          valueFormatter : function(x, opts, series_name, dg){
            return x != -1 ? '<strong>Closests Numeric Value ' + x + ' </strong>' : 'No data available. Hover on bar to see information';
          }
        }
      }
    }

    // Make Graph points if interval is zero else bar
    if( step === 0 ) {
      graphOptions.drawPoints = true;
      graphOptions.strokeWidth = 0.0;
      graphOptions.pointSize = 6;
      graphOptions.showRangeSelector = true;
    } else {
      graphOptions.plotter = ASC.barChartPlotter
    }

    // Create the initial graph
    graph.instance = new Dygraph(
      document.getElementById("graphWrap"), 
      data,
      graphOptions
    );    
  };

  var fillOptions = function(qArray){
    for( x in qArray.qOptions ){
      $("#"+x).val( qArray.qOptions[x] );
    }
  };
  
  var send = function(){
    _resetObj();
    ASC.clearGraphInterval();
    _generateGraph();
  };

  var recAns = function(clientID, name, answer){    
    var graph = ASC.params('graph');

    if( !ansObj.users.hasOwnProperty( clientID ) ) {

      // Increment the User Counter
      ansObj.usersCount++
      ansObj.users[clientID] = ansObj.usersCount;

      // Update Labels
      ansObj.labels = ["Values","Number of Responses"];
      graph.instance.updateOptions( { 'labels': ansObj.labels } );


      // Increment Total Response
      ASC.incrementTotal();
    } 

    // Update Graph
    _numericUpdate(answer); 

    // Update Individual Responses
    DISPLAY.updateIndResp(name,answer);   
  };

  var _numericUpdate = function(responseValue){
    var ansNumericData = ansObj.data
      , graph = ASC.params('graph');

    // Check to see if index is already created in data
    if( ansNumericData.hasOwnProperty(responseValue) ){
      // Index is found then increament by 1
      ansNumericData[responseValue] = ansNumericData[responseValue] + 1;
    } else {
      // Add index otherise and set to 1 
      ansNumericData[responseValue] = 1;
    }
    
    // Convert associative array to simple array for dygraph to function 
    var data = [];

    for(x in ansNumericData){
      numericValue = parseFloat(x);
      numberOfResponses = ansNumericData[x];
      data.push( [numericValue, numberOfResponses] );
    }
    data.sort(sortNumber);

    // Update the graph with the new array
    graph.instance.updateOptions( { 'file': data } );
  };

  var clearAnsVals = function(){
    _resetObj();
  }

  var displayReset = function(){
    DISPLAY.graphHtml();
  };

  var resizeAnswers = function(){
    ASC.params('graph').instance.resizeHandler_();
  };
  
  return {
    displayQuestionFn: display,
    displayOptions: true,
    fillOptionsFn: fillOptions,
    sendQuestionFn: send,
    recieveAnswerFn: recAns,
    clearAnsValsFn: clearAnsVals,
    displayResetFn: displayReset,
    resizeAnswersFn: resizeAnswers
  }
};
  
RIPPLE.questionType['numeric'].set = function(){
  var SC = RIPPLE.set.controller;

  var displaySetEdit = function(qTxt, qOptions){
    var min = "0"
      , max = "10"
      , step = "1";

    // Set qOptions from db
    if( qOptions != undefined ) {
      console.log("Numeric qOptions ::",typeof(qOptions) );
      if( qOptions.hasOwnProperty("min") ) min = qOptions.min;
      if( qOptions.hasOwnProperty("max") ) max = qOptions.max;
      if( qOptions.hasOwnProperty("step") ) step = qOptions.step;
    }

    var controls = '<label class="always-show">Minimum: </label><input class="auto-submit" data-name="min" type="number" value="' + min + '"/><br />';
    controls += '<label class="always-show">Maximum: </label><input class="auto-submit" data-name="max" class="auto-submit" data-name="max" type="number" value="' + max + '" max="100"/><br />'
    controls += '<label class="always-show">Interval between Numbers: </label><input class="auto-submit" data-name="step" type="number" value="' + step + '" min="1" max="10" /><br />'
    var outputControls = '<div class="numeric-options">' + controls + '</div>';
    return outputControls
  };

  return {
    displaySetEditFn: displaySetEdit
  }
};

RIPPLE.questionType['numeric'].client = function(){
  var CC = RIPPLE.client.controller
    , inputID = "numeric";

  var display = function(){
    var html = CC.createNumeric();
    $('#send-button').removeAttr('disabled').show();
    CC.showAnswer(html);
    CC.numericKeypadLoad();
  };

  var valid = function(){
    var errMsg = null
      , numericElem = $('#'+inputID)
      , answer = numericElem.val()
      , numericNum = parseFloat( answer )
      , max = parseFloat( numericElem.attr('max') )
      , min = parseFloat( numericElem.attr('min') )
      , step = parseFloat( numericElem.attr('step') )
      , interval = (numericNum - min) / step
      , closestStep = (Math.round(interval) * step) + min ;

    // Correct Interval to 4 decimal places
    interval = interval.toFixed(10);
    // Format Closest Step String to at most 4 decimal places 
    // // and no insignificant zeros
    closestStep = closestStep.toFixed(4).replace(/(\.[0-9]*?)0+$/, "$1");;
    console.log("Numeric Value :: ", numericNum );
    console.log("Min :: ", min  );
    console.log("Interval :: ", interval  );
    var isInInterval = step != 0 && parseInt( interval ) != interval;
    if ( answer === ""  ) errMsg = "Please provide a number to submit.";
    else if( min > answer ) errMsg = "Provided number is below the <strong>minimum of " + min + "</strong>";
    else if( answer > max ) errMsg = "Provided number is above the <strong>maximum of " + max + "</strong>";
    // Check to see if interval is whole number then it is a correct interval value
    else if( isInInterval ) errMsg = "Provided number is not at an interval value.<br /> <strong>Closest interval value is " + closestStep +"</strong>";

    // Clear Numeric Value on error
    if( errMsg ) numericElem.val("");

    return errMsg || false;
  };

  var send = function(){
    CC.answer = $('#'+inputID).val();
    now.distributeAnswer({ answer: CC.answer, qID: now.question.qID });
    //$("#send-button").attr("disabled", "disabled");
    $("#send-button").hide();    
  };

  return {
    displayFn: display,
    validFn: valid,
    sendFn: send
  }
};
RIPPLE.questionTypeBootstrap( RIPPLE.questionType['numeric'] );
