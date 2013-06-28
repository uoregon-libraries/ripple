$(document).ready(function(){
  var NOTIFY = new NotifyController();
  
  // Set UI Type
  now.type = "prof";

  // Define Initial Variables

  now.initialize = function(){
    // Setting the Default Room

  }	

  // Custom Form Submit
  $('#pluginConfig').submit(function(e){
    var data = $('#pluginConfig').serialize();

    // Disable button
    $('#pluginConfigSubmit').attr('disabled', 'disabled');
    NOTIFY.postData(document.URL, data).complete(function(){
      $('#pluginConfigSubmit').removeAttr('disabled');
    });
    e.preventDefault();
  })
});
