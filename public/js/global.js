var GLOBALS = {}
  , RIPPLE = {};

// Avoid `console` errors in browsers that lack a console.
;(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());
 
// jQuery 
(function ($) {
  // Fire when document is ready.
  $(document).ready(function() {
    // Make iOS delay touchend
    FastClick.attach(document.body);
    
    // handle user logout //  
    $('#btn-logout').click(function(e){ 
      GLOBALS.attemptLogout();
      e.preventDefault();
    });

    // Put Pathname into body class
    var pathArray = location.pathname.split('/')
      , pathClass = "page";
    while ( pathArray.length > 0 ){
      var pathElement = pathArray.shift();
      // Find First Character
      var subPathFirstChar = parseInt( pathElement.substring(0,1) );
      // Make sure that it is not a digit
      if( ! ( /^\d$/.test(subPathFirstChar) ) ) pathClass += "-" + pathElement;

    };

    // Change class when js is loaded
    $('body').removeClass('no-js').addClass('js ' + pathClass);

    // Initialize Sliding Panel
    var slidebarWidth = 260
      , adjSlideWidth = slidebarWidth + 20;
    GLOBALS.jPM = $.jPanelMenu({
      openPosition: slidebarWidth + "px",
      keyboardShortcuts: [{
        code: 27, /* Escape Key */
        open: false,
        close: true 
      }],
      before: clearChatCount,
      afterClose: jPanelStatic
    });

    GLOBALS.jPM.on();
    setTimeout(function(){
      jPanelStatic();
    }, 1000);
    // Add swipe to sidebar
    var isClientPage = $('#page').hasClass('client-page');
    $('.admin-page #content').swipe({
      allowPageScroll: "vertical",
      swipe:function(e,direction){
        switch(direction){
          case "left":
            if( GLOBALS.jPM.isOpen() && !isClientPage ) GLOBALS.jPM.close();
            break;
          case "right":
            if( !GLOBALS.jPM.isOpen() && !isClientPage ) GLOBALS.jPM.open();
            break;
        }
      }
    })


    //Skip Link
    $('#skip-to-content').click(function(){
      $('#content').focus();
    });

    // Stop Bubbling of click otherwise jPanelMenu is listening 
    //   and will close slidebar
    $('#jPanelMenu-menu').on('click touchend',function(e){
      e.stopPropagation();
    })
    // Hide chat notify
    $('#chat-count').css('visibility','hidden');
    
    // open slidebar
    $('#slidebar-btn, #chat-count, #chat-notify').on('click keydown', function(e) {
      if( !GLOBALS.isKeypressActivate(e) ) return;
      e.preventDefault();

      // Open or Close Slidebar      
      if( GLOBALS.jPM.isOpen() ) GLOBALS.jPM.close();
      else GLOBALS.jPM.open();

      // If keypress enter move focus
      if( GLOBALS.isOnlyKeypressActivate(e) && GLOBALS.jPM.isOpen() ) {
        $('#slidebar .subset a:first, #slidebar button:first').focus();
      } 

      // Clear the Chat Count
      clearChatCount();

      // Move Focus
      if( $(this).attr('id') == 'chat-count' || $(this).attr('id') == 'chat-notify') {
          if( GLOBALS.jPM.isOpen() ) $('#message-txt').focus();
        }
    });

    // Tooltip
    $( GLOBALS.params.tooltipSelector ).tooltip();

    // Overide Session Start to put in new window
    $('#nav-session').click(function(e){
      GLOBALS.openSessionWindow( $(this).prop('href'), e );
    })

    // Move focus to overlay on shown
    $(document).on('shown', '.modal', function(e){
      var modal = $(e.currentTarget)
        , firstInput = modal.find('input').first();
      if( firstInput.length > 0 ) firstInput.focus();
      else modal.focus();
    })

    // IE9 Bug Fix for menu not shutting all the way
    if( $('html.lt-ie10').length ) {
      $('#btn-logout').on('focusin', function(){
        setTimeout(function(){
          if( GLOBALS.jPM.isOpen) GLOBALS.jPM.close();
        }, 100);
      })
    }
  });

  /**
   * Clear the chat count
   */
  function clearChatCount(){
    var chatCnt = $('#chat-count');

    chatCnt.css('visibility', 'hidden');
    chatCnt.text("0");
  }

  function jPanelStatic(){
    $('.jPanelMenu-panel').css('position','static');
  }
})(jQuery);

GLOBALS.params = {
  tooltipSelector: "i[rel='tooltip'], button[rel='tooltip'], span[rel='tooltip'], a[rel='tooltip']"
}
GLOBALS.attemptLogout = function(){
  // Post to clear connect session
  $.ajax({
    url: "/logout",
    type: "POST",
    data: {logout : true},
    success: function(data){
      // Show Prompt
      GLOBALS.showLockedAlert('You are now logged out.<br>Redirecting you back to the homepage.');
    },
    error: function(jqXHR){
      console.error(jqXHR.responseText+' :: '+jqXHR.statusText);
    }   
  });
}; 
GLOBALS.showLockedAlert = function(msg){
  $('.modal-alert').modal({ show : false, keyboard : false, backdrop : 'static' });       
  $('.modal-alert .modal-header h3').text('Success!');
  $('.modal-alert .modal-body p').html(msg);
  $('.modal-alert').modal('show');
  $('.modal-alert button').click(function(){window.location.href = '/';})
  setTimeout(function(){window.location.href = '/';}, 3000);    
};

// Open Stand alone window for sessions
GLOBALS.openSessionWindow = function(URL, e){
  e.preventDefault();
  var newWindowWidth = ',width=' + $(window).width()
    , newWindowHeight = ',height=' + $(window).height();
  var newWindow = window.open(
    URL,
    'Session',
    'location=0,directories=0,status=0,menubar=0,copyhistory=0,titlebar=0' + newWindowWidth + newWindowHeight 
  );
  newWindow.moveTo(20,20);
};

GLOBALS.dynamicPopoverDirection = function(element, tooltip) {
  var $element, $tooltip, above, actualHeight, actualWidth, below, boundBottom, boundLeft, boundRight, boundTop, elementAbove, elementBelow, elementLeft, elementRight, isWithinBounds, left, pos, right;
  isWithinBounds = function(elementPosition) {
    return 0 <= elementPosition.top && 0 <= elementPosition.left;
  };
  $element = $(element);
  $tooltip = $(tooltip);
  pos = $.extend({}, $element.offset(), {
    width: $element.width(),
    height: $element.height(),
    tipWidth: $tooltip.width() + 20,
    tipHeight: $tooltip.height() + 40,
    windowHeight: $(window).height(),
    windowWidth: $(window).width()
  });

  // Positive indicate that space is available
  elementAbove = {
    top: pos.top - pos.tipHeight,
    left: pos.left - pos.tipWidth
  };
  elementBelow = {
    top:  pos.windowHeight - (pos.top + pos.height + pos.tipHeight),
    left: pos.left - pos.tipWidth
  };
  elementLeft = {
    top: pos.top - pos.tipHeight,
    left: pos.left - pos.tipWidth  
  };
  elementRight = {
    top: pos.windowHeight - ( pos.top + pos.height + pos.tipHeight/2),
    left: pos.windowWidth - (pos.left + pos.width + pos.tipWidth)
  };

  // Determine if within bounds
  above = isWithinBounds(elementAbove);
  bottom = isWithinBounds(elementBelow);
  left = isWithinBounds(elementLeft);
  right = isWithinBounds(elementRight);

  // Prioritize Directions
  if (bottom) return "bottom";
  else if (right) return "right";
  else if (above) return "top";
  else if (left) return "left";
  else return "right";
};

GLOBALS.cloneObj = function(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}

GLOBALS.isString = function(o) {
  return typeof o === "string" && o !== null && o !== "" && o !== false;
}

GLOBALS.genID = function(length){
  var id = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < length; i++ )
      id += possible.charAt(Math.floor(Math.random() * possible.length));

  return id;
}

GLOBALS.wysihtml5Options = {
  "font-styles": false
  //"link": false,
  //dom: { autoLink: false }
}

GLOBALS.createHint = function(hint){
  return ' <i class="icon-info-sign" rel="tooltip" title="' + hint + '" tabindex="0"></i> ';
}

GLOBALS.isKeypressActivate = function(e){
  if(e.type === "keypress" || e.type === "keyup" || e.type === "keydown"){
    // Check that code was an enter
    if( keyCode(e) === 13 || keyCode(e) === 32 ) return true;
    else return false;
  }
  return true;
}
GLOBALS.isOnlyKeypressActivate = function(e) {
  return isOnlyKeypressEnter || isOnlyKeypressSpace
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function isAplhaLower(x){
	return x.match(/^[a-z0-9]{6}$/);
}

function isKeypressEnter(e){
  if(e.type === "keypress" || e.type === "keyup" || e.type === "keydown"){
    // Check that code was an enter
    if( keyCode(e) === 13 ) return true;
    else return false;
  }
  return true;
}

function isOnlyKeypressEnter(e){
  if(e.type === "keypress" || e.type === "keyup" || e.type === "keydown"){
    // Check that code was an enter
    if( keyCode(e) === 13) return true;
    else return false;
  }
  return false;
}

function isOnlyKeypressSpace(e){
  if(e.type === "keypress" || e.type === "keyup" || e.type === "keydown"){
    // Check that code was an enter
    if( keyCode(e) === 32) return true;
    else return false;
  }
  return false;
}

function isKeypressEsc(e){
  if(e.type === "keypress" || e.type === "keyup" || e.type === "keydown"){
    // Check that code was an enter
    if( keyCode(e) === 27) return true;
  }
  return false;
}

function keyCode(e){
  return e.keyCode ? e.keyCode : e.which;
}

var EXTEND = {
  parseQueryString : function(qs){
    var queryObj = {}
      , pairs = qs.split('&');
    $.each(pairs, function(i, v){
      var pair = v.split('=');
      value = decodeURIComponent( pair[1] );
      value = value.replace("+", " ");
      queryObj[pair[0]] = value;
    });
    return queryObj;    
  }
}

// Make sure that Array has method indexOf
if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(needle) {
        for(var i = 0; i < this.length; i++) {
            if(this[i] === needle) {
                return i;
            }
        }
        return -1;
    };
}

RIPPLE.namespace = function() {
    var a=arguments, o=null, i, j, d, that=this;
    for (i=0; i<a .length; i=i+1) {
        d=a[i].split(".");
        o=that;
 
        // RIPPLE is implied, so it is ignored if it is included
        for (j=(d[0] == "RIPPLE") ? 1 : 0; j<d.length; j=j+1) {
            o[d[j]]=o[d[j]] || {};
            o=o[d[j]];
        }
    }
 
    return o;
};

// Create Name Spacing
RIPPLE.namespace('questionType');

RIPPLE.checkClass = function(rippleClass, methods, params){
    var err = []
      , methods = methods || 0
      , params = params || 0;

    // Check for Required Class, Methods and Parameters
    if( ! RIPPLE.questionType.hasOwnProperty(rippleClass) )
      err.push( "Missing Class Declaration: RIPPLE.questionType." + rippleClass );
    
    var qTypeClass = RIPPLE.questionType[rippleClass];

    var checkMethod = function(method){
      if( ! qTypeClass.hasOwnProperty(method) )
        err.push( "Missing Function: RIPPLE.questionType." + rippleClass + "." + method );
    }

    // Iterator over functions if array
    if( methods !== 0 ){
      if( typeof methods === 'string' ) checkMethod(methods);
      else {
        for (var i = methods.length - 1; i >= 0; i--) {
          checkMethod( methods[i] );
        };
      }
    }

    var checkParam = function(param){
      if( ! qTypeClass.hasOwnProperty(param) )
        err.push("Missing Parameter: RIPPLE.questionType." + rippleClass + "." + param);
    }

    // Iterator over params if array
    if( params !== 0 ){
      if( typeof params === 'string' ) checkParam( params );
      else{
        for (var i = params.length - 1; i >= 0; i--) {
          checkParam( params[i] );
        };
      }      
    }

    err = err.length > 0 ? err : true;
    if( err !== true) {
      for (var i = err.length - 1; i >= 0; i--) {
        console.error("ERROR: ",err[i]);
      };
      
    }
    return err;
};
RIPPLE.questionTypeBootstrap = function(refObj){
  var controller = RIPPLE.activeController;
  var hasFn = refObj.hasOwnProperty(controller) && (typeof refObj[controller] === 'function');
  if( !hasFn ) return false 
  // Add properties and methods to parent
  returnedObj = refObj[controller]();
  for (var attrname in returnedObj) { refObj[attrname] = returnedObj[attrname]; }  
};

