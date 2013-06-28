/**
 * Controls for Chatting
 *
 * @author William Myers
 */
function ChatController() {

}

ChatController.prototype.receiveMessage = function(sender, message){
	var chatCnt = $('#chat-count');

  $("#messages").append("<p><span class='badge badge-info'>" + sender + "</span> " + message + "</p>");  

	if( !$('body').hasClass('slidebar-open') ) {
		var cnt = parseInt( chatCnt.text() );
		cnt++

		chatCnt.text(cnt).css('visibility','visible');
	}
};

ChatController.prototype.sendMessage = function(nowDistributeMessage){
  var message = $('#message-txt');
  nowDistributeMessage(message.val());

  //Clear Message
  message.val("");    

  // Notify of sent
  $.jGrowl(message.val(), { header: "MESSAGE SENT" });
}