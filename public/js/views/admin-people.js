$(document).ready(function(){
  var NOTIFY = new NotifyController()
    , PC = new PeopleController()
    , userList = PC.settings.userList
    , buttonsActive = PC.settings.buttonsActive
    , modalConfirm = $('.modal-confirm')
    , modalError = $('.modal-form-errors')
    , addTemplate = $('#account-template')
    , highlightClass = "table-highlight"
    , activeClass = "person-active";
  
  // Change Table into dataTable
  userList.dataTable({
      "sDom": "<'row'<'span6'l><'span6'f>r>t<'row'<'span6'i><'span6'p>>",
      "sPaginationType":"bootstrap",
      "iDisplayLength":25,
      "oLanguage": {
        "sLengthMenu": "_MENU_ Accounts per page"
      },
      "fnPreDrawCallback": function( oSettings ) {
        personIdentified("inactive");
      }
  });

  // Highlight on focus
  userList.on('mousedown focus',"tr.person", function(e){
    personIdentified("active", e, this);
  });
  // ID person on click or keypress enter
  userList.on('mousedown keypress', "tr.person", function(e){
    if( !isKeypressEnter(e) ) return;
    // Set data
    PC.setIdData("active", e.currentTarget.id);
    highlightPerson(e.currentTarget);
  })
  // Remove Highlight & Data with using pagination
  userList.on('focus mousedown', ".pagination", function(e){
    personIdentified("inactive", e);
  });
  userList.on('focusout', "tbody", function(e){
    personIdentified('clearHighlight',e);
  });

  // Cancel in Modal closes overlay
  modalConfirm.on('mousedown', '#account-form-btn1', function(){
    modalConfirm.modal("hide");
  })
  // Move focus into modal when it is shown
  modalConfirm.on('shown', function () {
    $(this).find('input:visible:first, button:visible:first').focus();
  });
  modalConfirm.on('hide', function(){
    $('#content button:visible:first').focus();
  })
  
  /* Extend Standard Class for Bootstrap */
  $.extend( $.fn.dataTableExt.oStdClasses, {
    "sWrapper": "dataTables_wrapper form-inline",
    "sSortAsc": "header headerSortDown",
    "sSortDesc": "header headerSortUp",
    "sSortable": "header"
  });

  // Action buttons for list
  $('#people').on('mousedown keypress', '.people-action button', function(e){
    var button = e.currentTarget;
    console.log(e);

    if( !isKeypressEnter(e) ) return;

    if( $(button).hasClass('add-person') ) 
      showModalAccount("add", "Add New Account", "Create");
    else if( $(button).hasClass('edit-person') )
      showModalAccount("update", "Update Account", "Update");
    else if( $(button).hasClass('remove-person') ) 
      showModalAccount("delete", "Remove Account", "Remove");

  }); 

  // Prep Add Template
  prepFormBody( addTemplate );

  // AJAX Submit Form for Add
  $('body')
    .on('mousedown keypress', '#account-new-btn', function(e){
      if( !isKeypressEnter(e) ) return;
      submitAddUser();
    })
    .on("submit", "#account-new", function(e){
      submitAddUser();
      e.preventDefault();
    })


  // AJAX Submit Form for Update
  $('body')
    .on('mousedown keypress', '#account-update-btn', function(e){
      if( !isKeypressEnter(e) ) return;
      submitEditUser();
    })
    .on("submit", "#account-update", function(e){
      submitEditUser();
      e.preventDefault();
    })

  // AJAX Submit for Remove User
  $('body')
    .on("click", '.modal-footer .submit[data-form-submit="remove"]', function(){
      submitDeleteUser();
    })


  // AJAX Edit of Account
  
  function personIdentified(status, e, that){
    var buttons = $('#people .btn-group button')
      , value = null;

    switch(status){
      case "active":
        // set ID of row
        value = $(that).attr("id");
        // Remove Previous Highligh & Add Highlight
        userList.find('.'+highlightClass).removeClass(highlightClass);
        $(e.currentTarget).addClass(highlightClass);
        // Change button state & status
        if( !buttonsActive ) {
          buttons.removeAttr('disabled');
        }         
        break;
      case "inactive":
        // Disable buttons
        buttons.each(function(index){
          if( $(this).hasClass('edit-person') || $(this).hasClass('remove-person') ) $(this).attr('disabled','disabled');
        });
        // Clear Highlights
        userList.find('.'+highlightClass).removeClass(highlightClass);
        userList.find('.'+activeClass).removeClass(activeClass);
        // Set data
        PC.setIdData(status);
        break;
      case "clearHighlight":
        userList.find('.'+highlightClass).removeClass(highlightClass);
        break;
    }

  };

  function highlightPerson(elem){
    userList.find('.'+activeClass).removeClass(activeClass);
    $(elem).addClass(activeClass);
  }

  function showModalAccount(type, title, submitText, userObj){
    var htmlBody =""
      , formName = false
      , usernameEdit = false;

    // Remove submit button attributes
    modalConfirm.find('.modal-footer .submit')
      .html(' OK ')
      .removeAttr('data-form-submit')
      .removeClass(function (index, css) {
        return (css.match (/\bbtn-\S+/g) || []).join(' ');
      });

    // Lauch Modal
    switch(type){
      case "add":
        htmlBody = addTemplate.html();
        formName = 'account-new';
        usernameEdit = true;
        break;
      case "update":
        htmlBody = addTemplate.html();
        formName = 'account-update';
        break;
      case "delete":
        htmlBody = createDeleteMsg();
        modalConfirm.find('.modal-footer .submit')
          .addClass('btn-danger')
          .attr('data-form-submit','remove');
       break;
    }
    modalConfirm.find('.modal-body').html( htmlBody );
    modalConfirm.find('.modal-header h3').html(title);

    // Adjust modal form
    switch(type){
      case "add":
        modalConfirm.find('form')
          .attr('id',formName)
          .attr('action', '/signup')
          .append("<input type='hidden' name='redirect' value='false' />")
        modalConfirm.find('.form-actions').hide();
        modalConfirm.find('.submit')
          .attr('id',formName + '-btn')
          .addClass('btn-primary')
          .text(submitText);
        break;
      case "update":
        var hiddenInput1 = "<input type='hidden' name='action' value='update' />"
          , hiddenInput2 = "<input type='hidden' name='personID' value='" + PC.settings.personID + "' />"
        addUserData();
        modalConfirm.find('form')
          .attr('id',formName)
          .append(hiddenInput1+hiddenInput2)
;
        modalConfirm.find('.form-actions').hide();
        modalConfirm.find('.submit')
          .attr('id',formName + '-btn')
          .addClass('btn-primary')
          .text(submitText);
        break;
      case "delete":
        modalConfirm.find('.submit')
          .attr('id',formName + '-btn')
          .addClass('btn-warning')
          .text(submitText);
        break;
    }

    // Determine if able to edit username
    if( usernameEdit ) modalConfirm.find('#user-tf').removeAttr('disabled');
    else modalConfirm.find('#user-tf').attr('disabled','disabled');

    modalConfirm.modal({ 
      show : true, 
      keyboard : true, 
      backdrop : true 
    });
    
  };

  function prepFormBody(template){
    console.log(template);
    template.find('form').removeClass("span12").removeAttr("id");
    template.find('#sub1').html(""); 
    template.find('#account-form-btn2').addClass('btn-primary'); 

    // Add System Roles
    console.log(systemRoles);
    var roleChkBoxs = "";
    $.each(systemRoles, function(index, value){
      var displayName = value.charAt(0).toUpperCase() + value.slice(1);;
      if( value !== 'presenter' ) roleChkBoxs += '<input type="checkbox" name="roles" value="'+value+'" class="roleChkBoxs" /> '+ displayName;
    }); 

    // Add controls wrapper
    roleChkBoxs = '<div class="controls">' + roleChkBoxs + '</div>'
    roleChkLabel = '<label for="roles" class="control-label">Roles</lable>';
    // Add Control Group wrapper
    roleHTML = '<div id="role-cg" class="control-group">' + roleChkLabel + roleChkBoxs + '</div>';
    template.find(".account-roles").html(roleHTML);
  }

  function createDeleteMsg(){
    var personObj = PC.findUserObj();

    // Create html
    html = 'Are you sure that you would like to remove user - <strong>' + personObj.name + '</strong> ? <br />';
    html += 'This can <strong>NOT</strong> be undone!'

    return html;
  }

  function submitAddUser(e){
    var form = $("#account-new")
      , data = form.serializeArray();
    form.ajaxSubmit({
      beforeSubmit : function(formData, jqForm, options){
        // Since it is a dynamic form must initialize AV object
        AV = new AccountValidator();
        return AV.validateForm();
      },
      success : function(responseText, status, xhr, $form){
        if (status == 'success') {
          modalConfirm.modal("hide");
          console.log("Data",data);
          // Add row to table
          var name = data[0].value
            , email = data[1].value
            , user = data[2].value
            , role = "";

          if( typeof data[4] !== "undefined" ) role = data[4].value
          var row = [
            name,
            user,
            email,
            role
          ];
          //console.log("Row",row);
          userList.dataTable().fnAddData( row );
          // Make sure tabindex is set
          // Decided to not allow rows to be selectable because it doesn't have the object Id
          //  as the tr's id, so row can not be deleted or edited without reload
          // userList.find('tbody tr').attr("tabindex", 0).addClass('person');
          
          // Notify User of creation
          $.jGrowl('User Created :: ' + name);
        }
      },
      error : function(e){
        if (e.responseText == 'email-taken'){
            AV.showInvalidEmail();
        } else if (e.responseText == 'username-taken'){
            AV.showInvalidUserName();     
        }
      }
    });
  }

  function submitEditUser(){
    var form = $('#account-update')
      , serialized = form.serialize()
      , data = EXTEND.parseQueryString( serialized )
      , userObj = PC.findUserObj()
      , userIndex = PC.findUserObj("index");

    form.ajaxSubmit({
      success : function(responseText, status, xhr, $form){
        if (status == 'success') {
          // Adjust current Row
          var row = userList.dataTable().fnGetPosition( document.getElementById( PC.settings.personID) );
          data.roles = data.roles || "";
          var rowValues = [ data.name, userObj.user, data.email, data.roles ];
          userList.dataTable().fnUpdate( rowValues, row );
          modalConfirm.modal("hide");
          // Adjust DocArray
          userDoc = docArray[userIndex];
          userDoc.name = data.name;
          userDoc.email = data.email;
          userDoc.roles = [];
          if( data.roles.length !== 0 ){
            // Convert comma roles into array
            var currentRoles = data.roles.split(",");
            userDoc.roles = currentRoles;
          }
          // Update docArray
          docArray[userIndex].name = data.name;
          docArray[userIndex].email = data.email;
          docArray[userIndex].roles = currentRoles;
          // Notify User of creation
          $.jGrowl('User Updated :: ' + userObj.user);
        }
      },
      error : function(e){
        if (e.responseText == 'email-taken'){
            AV.showInvalidEmail();
        } 
        console.log("ERROR ::" +e.responseText);
      }
    });
  }

  function submitDeleteUser(){
    var personID = PC.settings.personID;
    console.log( "Person ID: ",  personID);
    if( !personID ) {
      $.jGrowl("System error - Can not determine the user.");
    }
    // Submit to Server
    $.ajax({
      type : "POST",
      url : location.url,
      data : 'personID=' + personID + '&action=remove',
      success : function(){
        // Remove row from DataTable
        userList.fnDeleteRow( userList.fnGetPosition( document.getElementById( PC.settings.personID) ) ) ;     
      },
      error : function(jqXHR, status, error){
        var response = $.parseJSON(jqXHR.responseText);
        console.log(response);
        $.jGrowl("ERROR :: " +response.error);
      }
    });
    modalConfirm.modal("hide");
  }

  function addUserData(){
    var userObj = PC.findUserObj();

    modalConfirm.find('button[type="submit"]').text("Update");
    modalConfirm.find('#name-tf').val( userObj.name );
    modalConfirm.find('#user-tf').val( userObj.user ).attr('disabled','disabled');
    modalConfirm.find('#email-tf').val( userObj.email );

    // Check to see if user has roles
    if( userObj.hasOwnProperty('roles') ){
      $.each(userObj.roles, function(index,role){
        console.log(role);
        modalConfirm.find('.roleChkBoxs[value="' + role + '"]').prop("checked", true);
      })
    }

  }
});

