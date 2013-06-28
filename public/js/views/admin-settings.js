$(document).ready(function(){
	var categoryLinks = $('#categories a')
		, categories = $('#categories')
		, variableContainer = $('#variable-container .variable-settings')
		, hash = window.location.hash
		, activeCategory = "";

	var NC = new NotifyController();

	// Select another category
	categoryLinks.on('click keypress', function(e){
		if( !isKeypressEnter(e) ) return;

		//console.log( $(this) );
		loadTab( $(this) );
	});

	// Click Cancel
	$('#cancel-btn').on('click keypress', function(e){
		if( !isKeypressEnter(e) ) return;

		location.reload(true);
	});

	var loadTab = function(activeLink){
		// Do nothing if this is the active link
		if( activeLink.parent().hasClass('active') ) return;
		// If there is no link then default to the fist
		if( activeLink.length === 0 ) activeLink = categoryLinks.first();

		toggleActiveNav(activeLink);
		var categoryID = activeLink.attr('href');
		displayVariables( categoryID );
		activeCategory = categoryID;

	}

	var toggleActiveNav = function(activeLink){
		// Change Active Class
		categories.find('.active').removeClass("active");
		activeLink.parent().addClass('active');
	}

	var displayVariables = function(variableID){
		//console.log($(variableID));

		// Hide/Show Settings
		variableContainer.hide();
		$(variableID).show();
	}

	// Hide Settings that should not be active
	if( !hash )	loadTab( categoryLinks.first() );
	else loadTab( categoryLinks.filter('[href="' + hash + '"]') );

	// Click Submit
	$('#save-btn').on('click keydown', function(e){
		if( !isKeypressEnter(e) ) return;

		var data = collectFormData();
    // Check to confirm that there is data
    if( data.length === 0 ) return;

    // Save Data
		NC.postData( document.URL , data);
    e.preventDefault();
	});

	var collectFormData = function(){
		var data = ""
      , categoryElems = $(activeCategory);

    // input data
    data = categoryElems.find('input').serialize();
    // button data
    if( categoryElems.find('.btn-group').length ){
      var buttonData = '';
      categoryElems.find('.btn-group .btn-active').each(function(i){
        console.log( $(this), i ); 
        buttonData += '&' + $(this).parent().attr("data-ref") + '=' + encodeURIComponent( $(this).attr("data-state") );
      });
      data += buttonData;
    }
    // Check Data for leading &
    data =  ( data.substring(0,1) === "&" ) ? data = data.substring(1, data.length) : data;

		console.log("Category Div :: ",activeCategory);
		console.log("Data :: ",data);

    return data;
	}

  // Click Toggle Control button
  $('#variable-container .toggle-control').on('click keydown', function(e){
    if( !isKeypressEnter(e) ) return;
    
    // Change Highlight
    $(this).addClass('btn-primary btn-active').siblings('.btn-active').removeClass('btn-primary btn-active');
    e.preventDefault();
  })
});