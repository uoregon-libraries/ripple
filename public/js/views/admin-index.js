var graphRoller = false;
var grapher = "";
$(document).ready(function(){
  var UTIL = new AdminUtilController()
    , DISPLAY = new AdminDisplayController();

  // Define Initial Variables
  var ansObj = {
    "True":0,
    "False":0,
    "A":0,
    "B":0,
    "C":0,
    "D":0,
    "E":0,
    "total":0
  };
  var ansDial = {};
  var firstSet = false;
  var showCloud = false;
  var flashAnswers = true;
  var stopPolling = false;

  //var barTimer = 0;
  now.initialize = function(){
    // Clear Student Questions
    now.distributeClear();

    // Set room number
    $('#roomDisplay').html('Room ID: ' + now.room).slideDown();
  }

  now.clientClearQuestion = function(){

  }

  now.receiveMessage = function(name, message){
    $("#messages").append("<p><span class='badge badge-info'>" + name + "</span> " + message + "</p>");
  }

  now.receiveAnswer = function(clientID, name, answer){
    if( !stopPolling ){
      if( now.question.type == "dial") {
        var t = new Date();

        if( !ansDial.users.hasOwnProperty( clientID ) ) {
          // Increment the User Counter
          ansDial.usersCount++
          ansDial.users[clientID] = ansDial.usersCount;

          // Update Labels
          ansDial.labels.push(name);
          grapher.updateOptions( { 'labels': ansDial.labels } );

          // Update Initial Array
          ansDial.data[0].push(0);

          // Update data
          var userIndex = parseInt(ansDial.users[clientID]);
          var dataIndex = parseInt(ansDial.data.length -1);
            
          // Put Current Answer in the last data array in correct position
          ansDial.data[dataIndex][userIndex] = answer;


          // Start the Interval after the first responder connects
          if( !firstSet ) {
            graphRoller = setInterval(function() {
              DISPLAY.dialUpdate(ansDial);
            }, 1000);

            // Set Clear Interval for 5 minutes due to amount of data
            graphTime = 5 * 60 * 1000;
            setTimeout(function(){
              clearInterval(graphRoller);
            }, graphTime);
            // Allow Interval to only be sent once
            firstSet = true;
          } 

          // Increment Total Response
          ansObj["total"] = UTIL.incrementVal("total", ansObj);

        } else {
          // Update data
          var userIndex = parseInt(ansDial.users[clientID]);
          var dataIndex = parseInt(ansDial.data.length -1);

          // Put Current Answer in the last data array in correct position
          ansDial.data[dataIndex][userIndex] = answer;
        }

      } else if ( now.question.type == "multiple-choice" || now.question.type == "true-false"){
        // Increment Total
        ansObj["total"] = UTIL.incrementVal("total", ansObj);

        // Increment and Set Answer
        ansObj[answer] = UTIL.incrementVal(answer, ansObj);
        
        UTIL.adjProgressBar(answer, ansObj);

        // Show Response
        $('#responses').prepend("<br />A: " + name + " - " + answer);

      } else if ( now.question.type == "open-response" ) {
        var answerWell = $('<p class="dynacloud well">' + answer + '</p>');
        answerWell.prependTo('#flash-display');
        if( flashAnswers ) answerWell.hide().fadeIn(1000).fadeOut(7000);

        // Only Show Cloud if it is requested
        if( showCloud ) $(".dynacloud").dynaCloud();

        // Show Response
        $('#responses').prepend("<br /><span class='badge badge-inverse'>A:</span> " + name + " - " + answer);
        
        // Increment Total
        ansObj["total"] = UTIL.incrementVal("total", ansObj);
      }

      // Display Total number of responses
      $('#total').text(ansObj["total"] );
    }
  }

  // handle user logout //  
  $('#room-fullscreen').click(function(e){ 
    console.log(now.room);
    roomURL = "<div class='roomLinkDisplay'>Room ID: <strong>" + now.room + "</strong></div>";
    DISPLAY.showRoomFullscreen(roomURL, 'Room ID:'); 
    e.preventDefault();
  });

  // Send Message
  $("#message-btn").click(function(){
    var message = $('#message-txt');
    now.distributeMessage(message.val());

    //Clear Message
    message.val("");    

    // Notify of sent
    $.jGrowl(message.val(), { header: "MESSAGE SENT" });
  });

  // Send Question
  $("#send-btn").click(function(){
    var typeVal = $('#type').val(),
      question = new Array(),
      qOptionsArr = new Array();

    // Resest Polling
    setPolling("on");

    // Serialize Answers
    qOptionsArr = $('#qOptions :input').serializeArray();
    question = {
      "type":typeVal,
      "qTxt":$("#question textarea").val(),
      "profName":now.name,
      "qOptions":qOptionsArr
    };

    // Distribute Question
    now.distributeQuestion(question);

    // Notify of sent
    $.jGrowl($("#question textarea").val(), { header: "QUESTION SENT" });

    // Put Answer Options above grid
    if( typeVal === "multiple-choice" || typeVal === "true-false"){
      UTIL.addAnswerToBars(ansObj);
    }else if( typeVal === "dial"){

    }

    // Clear Responses
    $('#qOptions .tally, #responses').html("");
    DISPLAY.total('0');
    ansObj = UTIL.clearVal(ansObj);
    UTIL.clearProgressBar();
    ansDial = {};
    UTIL.clearDialVals(ansDial);
    firstSet = false;
    showCloud = false;
    flashAnswers = true;
    stopPolling = false;

    if (typeVal == "dial"){
      DISPLAY.dial(ansDial);
    }
  });

  // Clear Question
  $('#clear-btn').click(function(){
    DISPLAY.clear(ansObj, ansDial);
    ansObj = UTIL.clearVal(ansObj);
  });

  // Stop Polling
  $('#stop-btn').click(function(){
    setPolling('off');
  });

  // Resume Polling
  $('#start-btn').click(function(){
    setPolling('on');
  });

  // Stop Graphing
  $('#stop-grapher').live("click", function(){
    console.log(graphRoller);
    clearInterval(graphRoller);
  })

  $('#word-cloud').live("click", function(){
    showCloud = true;    
    $(".dynacloud").dynaCloud();
  })

  $('#flash-show').live("click", function(){
    flashAnswers = false;
    $('#answers .dynacloud').stop(true, true).show();
    $('#flash-hide').show();
    $(this).hide();
  });

  $('#flash-hide').live("click", function(){
    flashAnswers = true;
    $('#answers .dynacloud').hide();
    $('#flash-show').show();
    $(this).hide();
  });

  $("#type").change(function(){
    // Clear Display
    DISPLAY.clear(ansObj, ansDial);

    // Fill Display with Question Type
    type = $(this).find('option:selected').val();
    if(type == "true-false") {
      DISPLAY.true();
    } else if (type == "multiple-choice"){
      DISPLAY.multiple();   
    } else if (type == "dial"){
      //Get the last value and put it in the array
      DISPLAY.dial(ansDial);
    } else if (type == "open-response"){
      grapher = DISPLAY.open();
    }

    // Clear Student Questions
    now.distributeClear();
  })

  // Hide Send
  grapher = DISPLAY.open();

  function setPolling (status){
    if( status === 'on' ){
      stopPolling = false;
      $('#start-btn').hide();
      $('#stop-btn').show();

    } else if ( status === 'off'){
      stopPolling = true ;  
      $('#start-btn').show();
      $('#stop-btn').hide();
    }
  }

  // Hide all the progress labels
  $('.ui-progress .ui-label').hide();

});

function clearGraph(){
  if( graphRoller != undefined) {
    clearInterval(graphRoller);
    graphRoller = false;
  }
}
