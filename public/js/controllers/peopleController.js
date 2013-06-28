function PeopleController() {
	this.settings = {
		buttonsActive: false,
    userList: $('#user-list'),
    personID: null
	};

	this.setIdData = function(status, value){
		var that = this
      , buttons = $('#people .btn-group button');

		switch(status){
      case "active":
        // Change button state & status
        if( !that.buttonsActive ) {
          that.buttonsActive = true;
        }         
        break;
      case "inactive":
        // Change buttons status
        buttonsActive = false;
        break;
		}
		// Set Data
		that.settings.personID = value;
	};

	this.findUserObj = function(subquery){
		var that = this
      , subquery = subquery || false;
		console.log(that.settings.personID)
		for( var i =0;  i < docArray.length; i++){
			if( docArray[i]._id == that.settings.personID ){
        if( !subquery ) return docArray[i];
        else if( subquery === "index" ) return i;
			}
		}
	};

}