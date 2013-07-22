
/**
 * Client Plugin Session API Module. 
 *
 * @author William Myers
 * @class plugin-client.session
 * @title session
 * @space RIPPLE.questionType['<i>pluginName</i>'].session<br /> <span class="note"><i>pluginName</i> will be replaced by your plugin's name</span>
 */
RIPPLE.namespace('session');
// Set up session components
RIPPLE.session.displayController = new SessionDisplayController();
RIPPLE.session.mainController = new SessionMainController();
RIPPLE.activeController = "session";

function SessionMainController() {
  var that = this
    , DISPLAY = RIPPLE.session.displayController
  
  console.log(RIPPLE);
  // console.log(RIPPLE.questionType);
  var initialParams = {
    "total":0,
    "setPolling":false,
    "firstSet":false,
    "graph":{"instance":{}, "interval":0},
    "timer":0,
    "flashAnswers":true,
    "initialQuestion":true    
  }
  var params = GLOBALS.cloneObj( initialParams );
  // Expose function to set and get params
  this.params = function(param, value, option){
    var that = this;
    
    var get = function(){
      // console.log("Params ["+param+"] get :: ",params[param])
      return params[param];
    }
    var set = function(){
      // console.log("Params ["+param+"] set :: ",value)
      params[param] = value;
    }

    if(typeof value !== 'undefined') set()
    else return get();
  };

  this.sendQuestion = function(nowDistributeQuestion){
    var type = $('#type').val()
      ,  question = []
      ,  qOptionsArr = [];

    // Serialize Answers
    qOptionsArr = $('#qOptions :input').serializeArray();
    question = {
      "type":type,
      "qTxt":$("#question textarea").val(),
      "authorID":now.name,
      // "qSessionID":$('#sessionID').val(),
      "qOptions":qOptionsArr
    };
    // if('question' in now 
    //   && 'sessionID' in now.question 
    //   && now.question.sessionID != '') {
    //     console.log(now.question.sessionID);
    //     question.sessionID = now.question.sessionID;
    //   }

    // Distribute Question
    nowDistributeQuestion(question);

    // Notify of sent
    $.jGrowl($("#question textarea").val(), { header: "QUESTION SENT" });

    // Clear Params
    params = GLOBALS.cloneObj( initialParams );

    /**
     * Hook fired when a question is sent to audience.
     * 
     * @event sendQuestionFn
     */
    var passCheck = RIPPLE.checkClass(type)
    var hasClearFn = RIPPLE.questionType[type].hasOwnProperty('sendQuestionFn');
    if( passCheck && hasClearFn ) RIPPLE.questionType[type].sendQuestionFn();

    // Clear Responses
    $('#qOptions .tally, #responses').html("");
    that.clearTotal()
    DISPLAY.total('0');
  };

  this.recieveAnswer = function(clientID, name, answer){
    var that = this
      , type = now.question.type;
    //if( !that.params("setPolling") ) return;

    // Check for Class, Methods, & Params
    var passCheck = RIPPLE.checkClass(type, 'recieveAnswerFn');    
    if( !passCheck ) return false; 

    RIPPLE.questionType[type].recieveAnswerFn(clientID, name, answer);

    // Display Total number of responses
    $('#total').text( that.params("total") );
  };

  this.graphUpdate = function(ansObj){
    console.log("[graphUpdate] args", arguments);
    var that = this
      , graph = params.graph;
    
    // Increment the clock in seconds
    ansObj.clock++;

    // Determine the current index and length
    var dataLen = ansObj.data.length;
    var dataIndex = dataLen - 1;

    // Copy the last data child array
    var preVals = ansObj.data[dataLen - 1].slice(0);
    var newVals = preVals;

    // Correct the time elements in the array - always the first indice
    newVals[0] = ansObj.clock;

    // Add the new values
    ansObj.data.push(newVals);

    // Update the graph with the new array
    graph.instance.updateOptions( { 'file': ansObj.data } );
  };

  this.startGraphing = function(ansObj){
    var that = this
      , graph = params.graph;

    graph.interval = setInterval(function() {
      that.graphUpdate(ansObj);
    }, 1000);

    // Set Clear Interval for 5 minutes due to amount of data
    var graphTime = 5 * 60 * 1000;
    params.timer = setTimeout(function(){
      clearInterval(graph.interval);
    }, graphTime);
  };

  this.graphPolling = function(action){
  	if( action === "start"){
      var type = $('#type').val()
        , passCheck = RIPPLE.checkClass(type, "getAnswerObjectFn");
      if( passCheck ) that.startGraphing( RIPPLE.questionType[type].getAnswerObjectFn() );
  	} else if( action === "stop" ){
      that.clearTimers();
  	}
  };

  this.clearTimers = function(){
    var graph = params.graph;
    if( graph.interval !== 0 ) clearInterval( graph.interval );
    if( params.timer > 0 ) clearInterval( params.timer );
  };

  this.incrementTotal = function(){
    var that = this
      , newTotal = DISPLAY.incrementVal("total", that.params("total") );

    that.params("total", newTotal);
    return newTotal;
  };

  this.clearTotal = function(){
    that.params('total', 0)
  }

  this.setOpenFlash = function(status){
    that.params('flashAnswers',status);
  };

  this.clearGraphInterval = function(){
    var currInterval = that.params('graph').interval;
    clearInterval( currInterval );
    currInterval = 0;
  };

  this.clearAnsVals = function(){
    var type = $('#type').val();

    // Clear an outstanding timers
    that.clearTimers();

    // Check for Class, Methods, & Params
    var passCheck = RIPPLE.checkClass(type);
    var hasClearFn = RIPPLE.questionType[type].hasOwnProperty('clearAnsValsFn');
    if( passCheck && hasClearFn ) RIPPLE.questionType[type].clearAnsValsFn();

  };

  this.setPolling = function(state){
    var that = this
    that.params["setPolling"] = state;
  }

  this.barChartPlotter = function(e) {
    var ctx = e.drawingContext;
    var points = e.points;
    var y_bottom = e.dygraph.toDomYCoord(0);  // see http://dygraphs.com/jsdoc/symbols/Dygraph.html#toDomYCoord
    var min = parseFloat($("input#min").val())
      , max = parseFloat($("input#max").val())
      , step = parseFloat($("#step").val() ); 

    // This should really be based on the minimum gap
    var intervals = (max - min) / step
      , graphWidth = parseInt( e.dygraph.getArea()["w"] )
      , spacing =  graphWidth / intervals
      , bar_width = 2/3 * spacing;
    ctx.fillStyle = e.color;

    // Do the actual plotting.
    for (var i = 0; i < points.length; i++) {
      var p = points[i]
       , center_x = p.canvasx;  // center of the bar
   
      ctx.fillRect(center_x - bar_width / 2, p.canvasy,
          bar_width, y_bottom - p.canvasy);
      ctx.strokeRect(center_x - bar_width / 2, p.canvasy,
          bar_width, y_bottom - p.canvasy);
    }
  };

}


// Should be in GLOBALS
function sortNumber(a,b){
   return a[0] - b[0];
}
