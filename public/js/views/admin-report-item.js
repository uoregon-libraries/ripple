$(document).ready(function(){
  var RIC = new ReportItemController()
    , responseClass = '.individual-responses';

  $('.responses-chevron').on('click keypress', function(e){
    if( !isKeypressEnter(e) ) return false;
    var $this = $(this)
      , chevRight = 'icon-chevron-right'
      , chevDown = 'icon-chevron-down'
      , results = $this.parent().siblings(responseClass)
      , removeChev , addChev;

    if( $this.hasClass(chevRight) ) {
      removeChev = chevRight;
      addChev = chevDown;
    } else {
      removeChev = chevDown;
      addChev = chevRight;
    }
    // Change Chevrons  
    results.slideToggle();
    $this.removeClass(removeChev).addClass(addChev);
  });
  $(responseClass).hide();
});