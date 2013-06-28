$(document).ready(function(){
  var NOTIFY = new NotifyController();
  
  // Set UI Type
  now.type = "prof";

  // Define Initial Variables

  now.initialize = function(){

  } 

  // Custom Form Submit
  $('#plugin-list .toggle-control').click(function(e){
    var that = $(this)
      , btnState = $(this).attr("data-state")
      , btnGroup = $(this).parent()
      , pluginName =  encodeURIComponent( btnGroup.attr("data-ref") )
      , data = "state=" + btnState + "&plugin=" + pluginName;
    //console.log(data);

    // Change Classes for Buttons
    btnGroup.children().removeClass('bnt-active').removeClass('btn-primary').prop('disabled', 'disabled');

    // Post and Notify
    NOTIFY.postData(document.URL, data).complete(function(){
      btnGroup.children().removeProp('disabled');
      that.addClass('btn-primary btn-active');
    });

    // Hide or show config button depending on button clicked
    var config = that.closest(".module-information").find(".configure")
    if (btnState == "1") {
      config.show();
    }
    else {
      config.hide();
    }

    e.preventDefault();
  })
});
