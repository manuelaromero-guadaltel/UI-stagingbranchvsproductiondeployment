function closeBalloon(id) {
	if (id == 1) $("#hidingMessage1").hide();
	if (id == 2) $("#hidingMessage2").hide();
	if (id == 3) $("#hidingMessage3").hide();
}

function progress(timeleft, timetotal, $element) {
	var progressBarWidth = timeleft * $element.width() / timetotal;
	$element.find('div').animate({
		width: progressBarWidth
	}, 500).html("");
	if (timeleft >= 0) {
		setTimeout(function() {
			progress(timeleft - 1, timetotal, $element);
		}, 1000);
	}
};