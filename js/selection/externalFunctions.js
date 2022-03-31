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

function sendFileToREST(e) {
	var data, xhr;

	data = new FormData();
	data.append('file', $('#file-upload-multiple')[0].files[0]);

	xhr = new XMLHttpRequest();

	xhr.onloadend = function(e) {
		if (xhr.status != 200) {
			var errorMessage = "An error has occured uploading file (Code: " + xhr.status + " - " + xhr.statusText + ")";
			$("#baloonText3").text("ERROR");
			$("#baloonSubText3").text(errorMessage);
			$("#hidingMessage3").fadeIn(3000).animate({
				opacity: 1.0
			}, 1000).fadeOut(12000);
			progress(12, 12, $('#progressBar3'));
		}
	};

	var urlValidator = serverURL;


	xhr.open('POST', urlValidator + 'TestObjects?action=upload', true);
	xhr.onreadystatechange = function(response) {
		if (xhr.readyState == 4) {
			var resp = JSON.parse(xhr.responseText);
			var testObjectId = resp.testObject.id;
			console.log(resp);
			console.log(testObjectId);
			$("#uploadTestObjectId").val(testObjectId);
			$("#baloonText1").text("Uploaded started");
			$("#hidingMessage1").fadeIn(1000).animate({
				opacity: 1.0
			}, 2500).fadeOut(1000);
			progress(3, 3, $('#progressBar1'));
			var fileName = "'" + resp.files[0].name + "' successfully uploaded";
			$("#baloonText2").text("Upload completed");
			$("#buttonStart").prop("disabled", false);
			$("#baloonSubText2").text(fileName);
			$("#hidingMessage2").fadeIn(3000).animate({
				opacity: 1.0
			}, 2500).fadeOut(3000);
			progress(6, 6, $('#progressBar2'));
		}
	};
	xhr.send(data);

	//e.preventDefault();
	//console.log(data);
}