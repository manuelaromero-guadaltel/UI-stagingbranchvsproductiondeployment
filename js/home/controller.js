// Show/Hide Beta banner
if (betaBanner == true) {
	$("#betaBanner").show();
} else {
	$("#betaBanner").hide();
}

//Show STAGING label
if (labelStaging == true) {
	$(document).prop('title', "[STAGING] " + $(document).prop('title'));
}
