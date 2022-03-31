ngApp.controller('myValidatorController', function($scope) {
	$scope.urlValidator = serverDirectURL;
	$scope.urlRealValidator = serverRealURL;
	$scope.betaBanner = betaBanner;
	$scope.labelStaging = labelStaging;
	$scope.serverToken = serverToken;

	// Show/Hide Beta banner
	if ($scope.betaBanner == true) {
		$("#betaBanner").show();
		console.log("Banner mostrato");
	} else {
		$("#betaBanner").hide();
		console.log("Banner nascosto");
	}

	//Show STAGING label
	if ($scope.labelStaging == true) {
		$(document).prop('title', "[STAGING] " + $(document).prop('title'));
	}

	$.ajaxSetup({
		cache: false
	});

	$scope.cropLabel = function(label, id) {
		var newLabel = label;
		if (label.length > 160) {
			newLabel = label.substring(0, 155) + " [...]";
		}
		if (newLabel.length < 85) {
			$("#testLabel_" + id).css("padding-top", "13px");
			$("#testLabel_" + id).css("height", "31px");
		} else {
			$("#testLabel_" + id).css("padding-top", "0px");
			$("#testLabel_" + id).css("height", "40px");
		}
		return newLabel;
	}

	$scope.roundNumber = function(i) {
		return Math.round(i + 0.4);
	}

	Date.prototype.addHours = function(h) {
		this.setHours(this.getHours() + h);
		return this;
	}

	$scope.formatTimestamp = function(timestamp) {
		var oggi = new Date();
		var offset = oggi.getTimezoneOffset();
		var dateTimeParts = timestamp.split('T'),
			timeParts = dateTimeParts[1].split(':'),
			dateParts = dateTimeParts[0].split('-'),
			dateFormatted;

		var testDate = new Date(dateParts[0], dateParts[1], dateParts[2], timeParts[0], timeParts[1], 0);
		offset = ((-1) * offset) / 60;
		correctedTestDate = testDate.addHours(offset);

		var year = correctedTestDate.getFullYear();
		var month = correctedTestDate.getMonth();
		var day = correctedTestDate.getDate();
		var hours = correctedTestDate.getHours();
		var minutes = correctedTestDate.getMinutes();

		dateFormatted = hours + ":" + minutes + " - " + day + "." + month + "." + year;
		var dateMoment = moment(dateFormatted, "hh:mm - DD.MM.YYYY").format("LT - DD.MM.YYYY");

		return dateMoment;
	}

	$scope.testResults = [];
	$scope.contentLoaded = false;
	$scope.loading_icon = false;
	$scope.uploadProcess = "no";
	$scope.uploadLabel = "";
	$scope.orderBy = "default";
	$("#dialog-confirm").hide();

	$scope.readDataForm = function() {
		var $_GET = {};
		document.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function() {
			function decode(s) {
				return decodeURIComponent(s.split("+").join(" "));
			}
			$_GET[decode(arguments[1])] = decode(arguments[2]);
		});
		$scope.uploadProcess = $_GET["uploadProcess"];
		$scope.uploadLabel = $_GET["text-label-report"];
	}

	function differenceTimestamp(timestamp1, timestamp2) {
		var difference = timestamp1 - timestamp2;
		var hoursDifference = Math.floor(difference / 60 / 60);

		return hoursDifference;
	}

	function toTimestamp(year, month, day, hour, minute, second) {
		var datum = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
		return datum.getTime() / 1000;
	}

	$scope.refreshStatusTest = function(id) {
		console.log("Refresh STATUS id " + id);
		index = $scope.testResults.findIndex(x => x.id === id);
		$.getJSON($scope.urlValidator + "TestRuns/" + id + ".json", function(data) {
			if (data.EtfItemCollection.testRuns !== undefined && data.EtfItemCollection.testRuns !== null) {
				var itemResult = [data.EtfItemCollection.testRuns.TestRun];
				// TEST Timestamp
				var testDate = data.EtfItemCollection.testRuns.TestRun.startTimestamp;
				var yearDate = testDate.substring(0, 4);
				var monthDate = testDate.substring(5, 7);
				var dayDate = testDate.substring(8, 10);
				var hourDate = testDate.substring(11, 13);
				var minDate = testDate.substring(14, 16);
				var testTimestamp = toTimestamp(yearDate, monthDate, dayDate, hourDate, minDate, 0);
				// Current Timestamp
				var currTimestamp = Math.floor(Date.now() / 1000);
				var difference = differenceTimestamp(currTimestamp, testTimestamp);
				var statusAfterRun = itemResult[0].status;
				if ((itemResult[0].status == "UNDEFINED") && (difference < 10)) {
					itemResult[0].status = "RUNNING";
					$("#backgroundStatus_" + id).removeClass("bg_undefined");
					$("#backgroundStatus_" + id).removeClass("bg_running");
					$("#backgroundStatus_" + id).removeClass("bg_UNDEFINED");
					$("#backgroundStatus_" + id).removeClass("bg_RUNNING");
					$("#backgroundStatus_" + id).addClass("bg_" + statusAfterRun);
				} else {
					$("#backgroundStatus_" + id).removeClass("bg_undefined");
					$("#backgroundStatus_" + id).removeClass("bg_running");
					$("#backgroundStatus_" + id).removeClass("bg_UNDEFINED");
					$("#backgroundStatus_" + id).removeClass("bg_RUNNING");
					$("#backgroundStatus_" + id).addClass("bg_" + statusAfterRun);
				}
				$scope.testResults[index].status = statusAfterRun;
				console.log(index, statusAfterRun);
				$("#labelStatus_" + id).text(statusAfterRun);
				var extension = "png";
				if (statusAfterRun == "RUNNING") extension = "gif";
				$("#iconStatus_" + id).attr("src", "../img/icons/" + statusAfterRun + "." + extension);
				if ((statusAfterRun == "RUNNING") || (statusAfterRun == "UNDEFINED")) {
					setTimeout($scope.refreshStatusTest, 3000, id);
				}
			} else {
				var statusAfterRun = "RUNNING";
				$scope.testResults[index].status = statusAfterRun;
				console.log(statusAfterRun);
				$("#labelStatus" + id).text(statusAfterRun);
				$("#backgroundStatus_" + id).removeClass("bg_undefined");
				$("#backgroundStatus_" + id).removeClass("bg_running");
				$("#backgroundStatus_" + id).removeClass("bg_UNDEFINED");
				$("#backgroundStatus_" + id).removeClass("bg_RUNNING");
				$("#backgroundStatus_" + id).addClass("bg_" + statusAfterRun);
				var extension = "png";
				if (statusAfterRun == "RUNNING") extension = "gif";
				$("#iconStatus" + id).attr("src", "../img/icons/" + statusAfterRun + "." + extension);
				if (statusAfterRun == "RUNNING") {
					setTimeout($scope.refreshStatusTest, 3000, id);
				}
			}
			$scope.$apply();
		}).catch(function(jqXHR, textStatus, errorThrown) {
			console.error(jqXHR);
			console.error(textStatus);
			console.error(errorThrown);
			$(document.body).css({
				'cursor': 'default'
			});
			var errorMessage = "An error has occured";
			$("#baloonText3").text("ERROR");
			$("#baloonSubText3").text(textStatus);
			$("#hidingMessage3").fadeIn(3000).animate({
				opacity: 1.0
			}, 2500).fadeOut(12000);
			progress(12, 12, $('#progressBar3'));
		});
	}

	$scope.readTestResults = function() {
		$scope.searchParameters = {};
		$scope.searchParameters.searchedTerm = [];
		$scope.searchParameters.resourceType = "any";
		$scope.searchParameters.status = "any";
		$scope.searchParameters.currPage = 1;
		$scope.searchParameters.pageSize = 30;
		$scope.numResults = $scope.testResults.length; // TO BE DELETED
		$scope.searchParameters.numPages = $scope.roundNumber($scope.numResults / $scope.searchParameters.pageSize);
		$scope.searchParameters.startResult = 1;
		$scope.searchParameters.endResult = $scope.searchParameters.pageSize;
		$scope.searchParameters.maxRefresh = 4;

		$.getJSON($scope.urlValidator + "TestRuns.json?limit=3000", function(data) {
			$scope.readDataForm();
			console.log(data.EtfItemCollection);
			$scope.numResults = data.EtfItemCollection.returnedItems;
			if(data.EtfItemCollection.hasOwnProperty('testRuns')){
				$scope.testResults = data.EtfItemCollection.testRuns.TestRun;
				$scope.searchParameters.numPages = $scope.roundNumber($scope.numResults / $scope.searchParameters.pageSize);
				$scope.searchParameters.startResult = 1;
				$scope.searchParameters.endResult = $scope.searchParameters.pageSize;
				$scope.contentLoaded = true;
				$scope.sortTestResults('startTimestamp', 'DESC', false)
				$scope.$apply();
				var counterRunning = 0;
				$scope.testResults.forEach(function(item) {
					var statusAfterRun = item.status;
					//statusAfterRun = "UNDEFINED";
					//if (item.status == "UNDEFINED") {
					//	item.status = "RUNNING";
					//	statusAfterRun = item.status;
					//}
					if ((statusAfterRun == "RUNNING") || (statusAfterRun == "UNDEFINED")) {
						counterRunning++;
						if (counterRunning < ($scope.searchParameters.maxRefresh + 1)) {
							console.log("Esegui refresh su " + item.id);
							setTimeout($scope.refreshStatusTest, 3000, item.id);
						}
					}
				});
			} else {
				$scope.testResults = [];
				$scope.searchParameters.numPages = 1;
				$scope.searchParameters.startResult = 0;
				$scope.searchParameters.endResult = 0;
				$scope.contentLoaded = true;
				$scope.$apply();
				var counterRunning = 0;
			}
		});
	}

	$scope.updateResultsLimit = function() {
		$scope.searchParameters.startResult = (($scope.searchParameters.currPage - 1) * $scope.searchParameters.pageSize) + 1;
		$scope.searchParameters.endResult = (($scope.searchParameters.currPage - 1) * $scope.searchParameters.pageSize) + $scope.searchParameters.pageSize;
		if ($scope.searchParameters.endResult > $scope.numResults) $scope.searchParameters.endResult = $scope.numResults;
	}

	$scope.changePage = function(page) {
		$scope.searchParameters.currPage = page;
		$scope.updateResultsLimit();
	}

	$scope.prevPage = function(page) {
		$scope.searchParameters.currPage--;
		if ($scope.searchParameters.currPage < 1) $scope.searchParameters.currPage = 1;
		$scope.updateResultsLimit();
	}

	$scope.nextPage = function(page) {
		$scope.searchParameters.currPage++;
		if ($scope.searchParameters.currPage > $scope.searchParameters.numPages) $scope.searchParameters.currPage = $scope.searchParameters.numPages;
		$scope.updateResultsLimit();
	}

	$scope.checkIfIsArray = function(item) {
		if (Array.isArray(item)) {
			return true;
		} else {
			return false;
		}
	}

	$scope.openTestObject = function(url) {
		var win = window.open($scope.urlValidator + "TestRuns/" + url + ".xml", '_testTaskTarget');
		win.focus();
	}

	$scope.reRunTest = function(id) {
		$.getJSON($scope.urlValidator + "TestRuns/" + id + ".json", function(data) {
			if (data.EtfItemCollection.testRuns !== undefined && data.EtfItemCollection.testRuns !== null) {
				var itemResult = data.EtfItemCollection.testRuns.TestRun;
				var id = itemResult.id;
				var label = itemResult.label;
				var status = itemResult.status;
				var testTasks = itemResult.testTasks.TestTask;
				console.log(testTasks);
				var testSuiteId = [];
				var testObjectId;
				if (Array.isArray(testTasks) == false) {
					testSuiteId.push(testTasks.executableTestSuite.ref);
					testObjectId = testTasks.testObject.ref;
				} else {
					var index = 0;
					testTasks.forEach(function(item) {
						testSuiteId.push(testTasks[index].executableTestSuite.ref);
						testObjectId = testTasks[index].testObject.ref;
						index++;
					})
				}
				console.log(testSuiteId);
				console.log(testObjectId);
				var fileNameTestObjectId = testObjectId.replace("EID", "");
				$.getJSON($scope.urlValidator + "TestObjects/" + fileNameTestObjectId + ".json", function(dataTestObject) {
					console.log(dataTestObject);
					var uploadType = "";
					if (dataTestObject.EtfItemCollection.testObjects.TestObject.hasOwnProperty('remoteResource')) {
						console.log("Remote file");
						uploadType = "remote_file";
						//console.log(dataTestObject.EtfItemCollection.testObjects.TestObject.description);
						//console.log(dataTestObject.EtfItemCollection.testObjects.TestObject.remoteResource);
					} else {
						console.log("File Upload");
						uploadType = "file_upload";
						//console.log(dataTestObject.EtfItemCollection.testObjects.TestObject.label);
					}
					var testRunRequest = {
						"label": label + " [RERUN]",
						"executableTestSuiteIds": testSuiteId,
						"arguments": {
							"files_to_test": ".*",
							"tests_to_execute": ".*"
						},
						"testObject": {
							"id": testObjectId
						}
					}
					console.log(JSON.stringify(testRunRequest));
					var parameters = {
						"testSuiteIds": testSuiteId,
						"label": label
					};
					var stringParameters = JSON.stringify(parameters);
					// Create Base64 Object
					var Base64 = {
						_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
						encode: function(e) {
							var t = "";
							var n, r, i, s, o, u, a;
							var f = 0;
							e = Base64._utf8_encode(e);
							while (f < e.length) {
								n = e.charCodeAt(f++);
								r = e.charCodeAt(f++);
								i = e.charCodeAt(f++);
								s = n >> 2;
								o = (n & 3) << 4 | r >> 4;
								u = (r & 15) << 2 | i >> 6;
								a = i & 63;
								if (isNaN(r)) {
									u = a = 64
								} else if (isNaN(i)) {
									a = 64
								}
								t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a)
							}
							return t
						},
						decode: function(e) {
							var t = "";
							var n, r, i;
							var s, o, u, a;
							var f = 0;
							e = e.replace(/[^A-Za-z0-9\+\/\=]/g, "");
							while (f < e.length) {
								s = this._keyStr.indexOf(e.charAt(f++));
								o = this._keyStr.indexOf(e.charAt(f++));
								u = this._keyStr.indexOf(e.charAt(f++));
								a = this._keyStr.indexOf(e.charAt(f++));
								n = s << 2 | o >> 4;
								r = (o & 15) << 4 | u >> 2;
								i = (u & 3) << 6 | a;
								t = t + String.fromCharCode(n);
								if (u != 64) {
									t = t + String.fromCharCode(r)
								}
								if (a != 64) {
									t = t + String.fromCharCode(i)
								}
							}
							t = Base64._utf8_decode(t);
							return t
						},
						_utf8_encode: function(e) {
							e = e.replace(/\r\n/g, "\n");
							var t = "";
							for (var n = 0; n < e.length; n++) {
								var r = e.charCodeAt(n);
								if (r < 128) {
									t += String.fromCharCode(r)
								} else if (r > 127 && r < 2048) {
									t += String.fromCharCode(r >> 6 | 192);
									t += String.fromCharCode(r & 63 | 128)
								} else {
									t += String.fromCharCode(r >> 12 | 224);
									t += String.fromCharCode(r >> 6 & 63 | 128);
									t += String.fromCharCode(r & 63 | 128)
								}
							}
							return t
						},
						_utf8_decode: function(e) {
							var t = "";
							var n = 0;
							var r = c1 = c2 = 0;
							while (n < e.length) {
								r = e.charCodeAt(n);
								if (r < 128) {
									t += String.fromCharCode(r);
									n++
								} else if (r > 191 && r < 224) {
									c2 = e.charCodeAt(n + 1);
									t += String.fromCharCode((r & 31) << 6 | c2 & 63);
									n += 2
								} else {
									c2 = e.charCodeAt(n + 1);
									c3 = e.charCodeAt(n + 2);
									t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
									n += 3
								}
							}
							return t
						}
					}
					encrypted = Base64.encode(stringParameters);
					console.log(encrypted);
					if (uploadType == "remote_file") {
						$(document.body).css({
							'cursor': 'wait'
						});
						var requestJSON = {
							type: "POST",
							url: $scope.urlValidator + "TestRuns",
							data: JSON.stringify(testRunRequest),
							contentType: "application/json; charset=utf-8",
							dataType: "json",
							success: function(data) {
								console.log(data);
								console.log(data.EtfItemCollection.testRuns.TestRun.id);
								location.href = "../test-run/index.html?id=" + data.EtfItemCollection.testRuns.TestRun.id;
							},
							error: function(errMsg) {
								$(document.body).css({
									'cursor': 'default'
								});
								$("#buttonStart").prop('disabled', false);
								console.log(errMsg);
								alert(JSON.stringify(errMsg));
							}
						};
						if ($scope.serverToken != "") requestJSON.headers = { 'x-api-key': $scope.serverToken }
						$.ajax(requestJSON);
					} else {
						location.href = "../test-rerun/index.html?parameters=" + encrypted;
					}
				}).catch(function(jqXHR, textStatus, errorThrown) {
					console.error(jqXHR);
					console.error(textStatus);
					console.error(errorThrown);
					var testRunRequest = {
						"label": label + " [RERUN]",
						"executableTestSuiteIds": testSuiteId,
						"arguments": {
							"files_to_test": ".*",
							"tests_to_execute": ".*"
						},
						"testObject": {
							"id": testObjectId
						}
					}
					console.log(JSON.stringify(testRunRequest));
					var parameters = {
						"testSuiteIds": testSuiteId,
						"label": label
					};
					var stringParameters = JSON.stringify(parameters);
					// Create Base64 Object
					var Base64 = {
						_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
						encode: function(e) {
							var t = "";
							var n, r, i, s, o, u, a;
							var f = 0;
							e = Base64._utf8_encode(e);
							while (f < e.length) {
								n = e.charCodeAt(f++);
								r = e.charCodeAt(f++);
								i = e.charCodeAt(f++);
								s = n >> 2;
								o = (n & 3) << 4 | r >> 4;
								u = (r & 15) << 2 | i >> 6;
								a = i & 63;
								if (isNaN(r)) {
									u = a = 64
								} else if (isNaN(i)) {
									a = 64
								}
								t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a)
							}
							return t
						},
						decode: function(e) {
							var t = "";
							var n, r, i;
							var s, o, u, a;
							var f = 0;
							e = e.replace(/[^A-Za-z0-9\+\/\=]/g, "");
							while (f < e.length) {
								s = this._keyStr.indexOf(e.charAt(f++));
								o = this._keyStr.indexOf(e.charAt(f++));
								u = this._keyStr.indexOf(e.charAt(f++));
								a = this._keyStr.indexOf(e.charAt(f++));
								n = s << 2 | o >> 4;
								r = (o & 15) << 4 | u >> 2;
								i = (u & 3) << 6 | a;
								t = t + String.fromCharCode(n);
								if (u != 64) {
									t = t + String.fromCharCode(r)
								}
								if (a != 64) {
									t = t + String.fromCharCode(i)
								}
							}
							t = Base64._utf8_decode(t);
							return t
						},
						_utf8_encode: function(e) {
							e = e.replace(/\r\n/g, "\n");
							var t = "";
							for (var n = 0; n < e.length; n++) {
								var r = e.charCodeAt(n);
								if (r < 128) {
									t += String.fromCharCode(r)
								} else if (r > 127 && r < 2048) {
									t += String.fromCharCode(r >> 6 | 192);
									t += String.fromCharCode(r & 63 | 128)
								} else {
									t += String.fromCharCode(r >> 12 | 224);
									t += String.fromCharCode(r >> 6 & 63 | 128);
									t += String.fromCharCode(r & 63 | 128)
								}
							}
							return t
						},
						_utf8_decode: function(e) {
							var t = "";
							var n = 0;
							var r = c1 = c2 = 0;
							while (n < e.length) {
								r = e.charCodeAt(n);
								if (r < 128) {
									t += String.fromCharCode(r);
									n++
								} else if (r > 191 && r < 224) {
									c2 = e.charCodeAt(n + 1);
									t += String.fromCharCode((r & 31) << 6 | c2 & 63);
									n += 2
								} else {
									c2 = e.charCodeAt(n + 1);
									c3 = e.charCodeAt(n + 2);
									t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
									n += 3
								}
							}
							return t
						}
					}
					encrypted = Base64.encode(stringParameters);
					console.log(encrypted);
					location.href = "../test-rerun/index.html?parameters=" + encrypted;
				});
			}
		});
	}

	$scope.deleteTest = function(id) {
		$(function() {
			$("#dialog-confirm").dialog({
				title: "Delete test " + id + "?"
			});
			$("#dialog-confirm").dialog({
				resizable: false,
				height: "auto",
				width: 600,
				modal: true,
				buttons: {
					"Ok": function() {
						$(this).dialog("close");
						$(document.body).css({
							'cursor': 'wait'
						});
						$.ajax({
							url: $scope.urlValidator + 'TestRuns/' + id,
							type: 'DELETE',
							success: function(result) {
								location.reload();
							},
							error: function(err) {
								$(document.body).css({
									'cursor': 'default'
								});
								alert(err);
							}
						});
					},
					Cancel: function() {
						$(this).dialog("close");
					}
				}
			});
			$("#dialog-confirm").parent(".ui-dialog").css("position", "fixed");
			$("#dialog-confirm").parent(".ui-dialog").css("top", "500px");
		});
	}

	$scope.showDetail = function(id) {
		if ($("#testDetail_" + id).is(":hidden")) {
			$("#testDetail_" + id).removeClass("detailHidden")
			$("#expander_" + id).text("-");
			var newHeight = $("#content_" + id).height();
			$("#backgroundStatus_" + id).css("height", (newHeight + 65) + "px");
		} else {
			$("#testDetail_" + id).addClass("detailHidden")
			$("#expander_" + id).text("+");
			$("#backgroundStatus_" + id).css("height", "54px");
		}
	}

	$scope.xmlReplace = function(url) {
		if (typeof url === 'undefined') {
			url = url.replace(".json", ".xml");
		} else {
			url = "";
		}
		return url;
	}

	$scope.mappingTestSuite = function(item) {
		if (typeof item === 'undefined') {
			return "";
		} else {
			testSuiteId = item.replace("//v2", "/v2");
			testSuiteId = testSuiteId.replace($scope.urlValidator + "ExecutableTestSuites/", "");
			testSuiteId = testSuiteId.replace(".json", "");
			if (testSuiteId.substring(0,3) != "EID") testSuiteId = "EID" + testSuiteId;
			var testSuiteDesc = testSuiteId;
			if (testSuiteId == "EIDe3500038-e37c-4dcf-806c-6bc82d585b3b") testSuiteDesc = "Conformance Class XML encoding of ISO 19115/19119 metadata";
			if (testSuiteId == "EIDec7323d5-d8f0-4cfe-b23a-b826df86d58c") testSuiteDesc = "Conformance Class INSPIRE Profile based on EN ISO 19115 and EN ISO 19119";
			if (testSuiteId == "EID9a31ecfc-6673-43c0-9a31-b4595fb53a98") testSuiteDesc = "Conformance class Metadata for interoperability";
			if (testSuiteId == "EID59692c11-df86-49ad-be7f-94a1e1ddd8da") testSuiteDesc = "Common Requirements for ISO/TC 19139:2007 based INSPIRE metadata records";
			if (testSuiteId == "EIDe4a95862-9cc9-436b-9fdd-a0115d342350") testSuiteDesc = "Conformance Class 1: Baseline metadata for data sets and data set series";
			if (testSuiteId == "EID2be1480a-fe42-40b2-9420-eb0e69385c80") testSuiteDesc = "Conformance Class 2: INSPIRE data sets and data set series interoperability metadata";
			if (testSuiteId == "EID0b86f7a3-2947-4841-823d-6a00d8e06d70") testSuiteDesc = "Conformance Class 2b: INSPIRE data sets and data set series metadata for Monitoring";
			if (testSuiteId == "EID1067d6b2-3bb1-4e71-8ce1-a744c9bd5a3b") testSuiteDesc = "Conformance Class 2c: INSPIRE data sets and data set series metadata for IACS";
			if (testSuiteId == "EID59692c11-df86-49ad-be7f-94a1e1ddd8da") testSuiteDesc = "Common Requirements for ISO/TC 19139:2007 based INSPIRE metadata records";
			if (testSuiteId == "EID8f869e23-c9e9-4e86-8dca-be30ff421229") testSuiteDesc = "Conformance Class 3: INSPIRE Spatial Data Service baseline metadata";
			if (testSuiteId == "EID606587df-65a8-4b7b-9eee-e0d94daaa42a") testSuiteDesc = "Conformance Class 4: INSPIRE Network Services metadata";
			if (testSuiteId == "EID59692c11-df86-49ad-be7f-94a1e1ddd8da") testSuiteDesc = "Common Requirements for ISO/TC 19139:2007 based INSPIRE metadata records";
			if (testSuiteId == "EID8f869e23-c9e9-4e86-8dca-be30ff421229") testSuiteDesc = "Conformance Class 3: INSPIRE Spatial Data Service baseline metadata.";
			if (testSuiteId == "EID8db54d8a-8578-4959-b891-5394d9f53a28") testSuiteDesc = "Conformance Class 5: INSPIRE Invocable Spatial Data Services metadata";
			if (testSuiteId == "EID7514777a-6cb8-499c-acd5-912496dc84e9") testSuiteDesc = "Conformance Class 6: INSPIRE Interoperable Spatial Data Services metadata";
			if (testSuiteId == "EIDa593a7ad-42d9-46d0-985d-9dff3e684428") testSuiteDesc = "Conformance Class 7: INSPIRE Harmonised Spatial Data Services metadata";
			if (testSuiteId == "EIDeec9d674-d94b-4d8d-b744-1309c6cae1d2") testSuiteDesc = "Conformance Class View Service WMS";
			if (testSuiteId == "EID550ceacf-b3cb-47a0-b2dd-d3edb18344a9") testSuiteDesc = "Conformance Class View Service WMTS";
			if (testSuiteId == "EIDed2d3501-d700-4ff9-b9bf-070dece8ddbd") testSuiteDesc = "Conformance Class Direct WFS";
			if (testSuiteId == "EID174edf55-699b-446c-968c-1892a4d8d5bd") testSuiteDesc = "Conformance Class Pre-defined WFS";
			if (testSuiteId == "EID11571c92-3940-4f42-a6cd-5e2b1c6f4d93") testSuiteDesc = "Conformance Class Pre-defined Atom";
			if (testSuiteId == "EID074570ad-d720-47b3-af79-d54201793404") testSuiteDesc = "Conformance Class Download Service WCS Core";
			if (testSuiteId == "EID0ff73873-5601-41ff-8d92-3fb1fbba3cf2") testSuiteDesc = "Conformance Class Download Service Pre-defined SOS";
			if (testSuiteId == "EIDc837298f-a10e-42d1-88f2-f1415cbbb463") testSuiteDesc = "Conformance Class Discovery Service CSW";
			if (testSuiteId == "EID545f9e49-009b-4114-9333-7ca26413b5d4") testSuiteDesc = "Conformance Class INSPIRE GML encoding";
			if (testSuiteId == "EID61070ae8-13cb-4303-a340-72c8b877b00a") testSuiteDesc = "Conformance Class Data consistency";
			if (testSuiteId == "EID09820daf-62b2-4fa3-a95f-56a0d2b7c4d8") testSuiteDesc = "Conformance Class INSPIRE GML application schemas";
			if (testSuiteId == "EID499937ea-0590-42d2-bd7a-1cafff35ecdb") testSuiteDesc = "Conformance Class Information accessibility";
			if (testSuiteId == "EID63f586f0-080c-493b-8ca2-9919427440cc") testSuiteDesc = "Conformance Class Reference systems";
			// VIEW SERVICE
			if (testSuiteId == "EIDeec9d674-d94b-4d8d-b744-1309c6cae1d2") testSuiteDesc = "Conformance Class View Service WMS";
			if (testSuiteId == "EID550ceacf-b3cb-47a0-b2dd-d3edb18344a9") testSuiteDesc = "Conformance Class View Service WMTS";
			// DOWNLOAD SERVICE
			if (testSuiteId == "EIDed2d3501-d700-4ff9-b9bf-070dece8ddbd") testSuiteDesc = "Conformance Class Direct WFS";
			if (testSuiteId == "EID1104fc9f-a7af-3862-9bd1-9f02921103a2") testSuiteDesc = "WFS 2.0 (OGC 09-025r2/ISO 19142) Conformance Test Suite";
			if (testSuiteId == "EID85df0f3f-f55a-3944-a88f-f1cb4763336d") testSuiteDesc = "WFS 2.0 (OGC 09-025r2/ISO 19142) Conformance Test Suite";
			if (testSuiteId == "EID174edf55-699b-446c-968c-1892a4d8d5bd") testSuiteDesc = "Conformance Class Pre-defined WFS";
			if (testSuiteId == "EID11571c92-3940-4f42-a6cd-5e2b1c6f4d93") testSuiteDesc = "Conformance Class Pre-defined Atom";
			if (testSuiteId == "EID074570ad-d720-47b3-af79-d54201793404") testSuiteDesc = "Conformance Class Download Service WCS Core";
			if (testSuiteId == "EID0ff73873-5601-41ff-8d92-3fb1fbba3cf2") testSuiteDesc = "Conformance Class Download Service Pre-defined SOS";
			if (testSuiteId == "EID599648e9-316c-31ba-bae4-1a8668ce05fb") testSuiteDesc = "Conformance Class OGC API - Features";
			// DISCOVERY SERVICE
			if (testSuiteId == "EIDc837298f-a10e-42d1-88f2-f1415cbbb463") testSuiteDesc = "Conformance Class Discovery Service CSW";
			// DATASET
			if (testSuiteId == "EID545f9e49-009b-4114-9333-7ca26413b5d4") testSuiteDesc = "Conformance Class INSPIRE GML encoding";
			if (testSuiteId == "EID61070ae8-13cb-4303-a340-72c8b877b00a") testSuiteDesc = "Conformance Class Data consistency";
			if (testSuiteId == "EID09820daf-62b2-4fa3-a95f-56a0d2b7c4d8") testSuiteDesc = "Conformance Class INSPIRE GML application schemas";
			if (testSuiteId == "EID499937ea-0590-42d2-bd7a-1cafff35ecdb") testSuiteDesc = "Conformance Class Information accessibility";
			if (testSuiteId == "EID63f586f0-080c-493b-8ca2-9919427440cc") testSuiteDesc = "Conformance Class Reference systems";
			if (testSuiteId == "EIDe6800faf-2e56-47df-831a-75a96b35f33d") testSuiteDesc = "Conformance Class GML application schema, Addresses";
			if (testSuiteId == "EID8aaef94b-6a4d-47ab-a5d0-70ad5cb28b08") testSuiteDesc = "Conformance Class Application schema, Addresses Simple";
			if (testSuiteId == "EID9c31fa6e-1fab-4345-bf29-6d2c129de312") testSuiteDesc = "Conformance Class 'Data consistency, Addresses'";
			if (testSuiteId == "EID334bbd38-378d-4a44-8a19-5d00df919ec0") testSuiteDesc = "Conformance Class 'Information accessibility, Addresses'";
			if (testSuiteId == "EID6985a681-fd81-4448-83e8-061758b9ca8c") testSuiteDesc = "Conformance Class 'Reference systems, Addresses'";
			if (testSuiteId == "EID47c569bc-677d-4ce3-8411-e2b29189332a") testSuiteDesc = "Conformance Class 'GML application schemas, Administrative Units'";
			if (testSuiteId == "EIDddecef4b-89a3-4f9d-9246-a50b588fa5a2") testSuiteDesc = "Conformance Class 'Application schema, Administrative Units - Administrative Units'";
			if (testSuiteId == "EID117562c2-d6e1-4345-9f7b-cba229cf6685") testSuiteDesc = "Conformance Class 'Application schema, Administrative Units - Maritime Units'";
			if (testSuiteId == "EIDacc5931c-4ff0-499f-b916-3cda1603456b") testSuiteDesc = "Conformance Class 'Data consistency, Administrative Units'";
			if (testSuiteId == "EIDee28b75e-5c80-4370-838d-ab1b18e30b13") testSuiteDesc = "Conformance Class 'Information accessibility, Administrative Units'";
			if (testSuiteId == "EIDcafb75f8-5deb-4cca-89df-d3189322e97f") testSuiteDesc = "Conformance Class 'Reference systems, Administrative Units'";
			if (testSuiteId == "EID18b742d0-15eb-421f-bbec-7c8c5cf7ee1a") testSuiteDesc = "Conformance Class 'GML application schemas, Cadastral Parcels'";
			if (testSuiteId == "EID1f9bc92a-5879-4e9b-bcbe-1d2d0cab0aab") testSuiteDesc = "Conformance Class 'Application schema, Cadastral Parcels'";
			if (testSuiteId == "EID92032cdb-db88-42aa-96c0-70a1af9e68b1") testSuiteDesc = "Conformance Class 'Data consistency, Cadastral Parcel'";
			if (testSuiteId == "EIDc4fbae00-3070-49fa-b803-24c66c31ac70") testSuiteDesc = "Conformance Class 'Information accessibility, Cadastral Parcels'";
			if (testSuiteId == "EIDdbcc48ae-6871-4444-8e95-547bc22aacb2") testSuiteDesc = "Conformance Class 'Reference systems, Cadastral Parcels'";
			if (testSuiteId == "EID02b7b0cb-429a-4f4e-b0db-988464fb9496") testSuiteDesc = "Conformance Class 'GML application schemas, Geographical Names'";
			if (testSuiteId == "EID0fc46305-c623-422b-b7d7-251c3b86eb7f") testSuiteDesc = "Conformance Class 'Application schema, Geographical Names'";
			if (testSuiteId == "EIDa32f76c7-f1d3-4d70-83ef-d51d2545fa2e") testSuiteDesc = "Conformance Class 'Data consistency, Geographical Names'";
			if (testSuiteId == "EIDc3379b85-853e-4a35-8c3d-b64191d94587") testSuiteDesc = "Conformance Class 'Information accessibility, Geographical Names'";
			if (testSuiteId == "EID1620bd27-b881-48a2-bf2b-301541e035f4") testSuiteDesc = "Conformance Class 'Reference systems, Geographical Names'";
			if (testSuiteId == "EID81b070d3-b17f-430b-abee-456268346912") testSuiteDesc = "Conformance Class 'GML application schemas, Hydrography'";
			if (testSuiteId == "EIDe008001b-5233-4081-a1ae-515d7702ce02") testSuiteDesc = "Conformance Class 'Application schema, Hydrography - Network'";
			if (testSuiteId == "EIDd0b58f38-98ae-43a8-a787-9a5084c60267") testSuiteDesc = "Conformance Class 'Data consistency, Hydrography'";
			if (testSuiteId == "EID893b7541-c9cb-4e0a-9f84-5d55cad1866c") testSuiteDesc = "Conformance Class 'Information accessibility, Hydrography'";
			if (testSuiteId == "EID122b2f38-302f-4271-9653-69cf86fcb5c4") testSuiteDesc = "Conformance Class 'Reference systems, Hydrography'";
			if (testSuiteId == "EID81b070d3-b17f-430b-abee-456268346912") testSuiteDesc = "Conformance Class 'GML application schemas, Hydrography'";
			if (testSuiteId == "EID45133c90-1929-405c-867d-9648b0620bf7") testSuiteDesc = "Conformance Class 'Application schema, Hydrography - Physical Waters'";
			if (testSuiteId == "EIDd0b58f38-98ae-43a8-a787-9a5084c60267") testSuiteDesc = "Conformance Class 'Data consistency, Hydrography'";
			if (testSuiteId == "EID893b7541-c9cb-4e0a-9f84-5d55cad1866c") testSuiteDesc = "Conformance Class 'Information accessibility, Hydrography'";
			if (testSuiteId == "EID122b2f38-302f-4271-9653-69cf86fcb5c4") testSuiteDesc = "Conformance Class 'Reference systems, Hydrography'";
			if (testSuiteId == "EID8222c253-8468-4b94-a46b-2d1af1698a65") testSuiteDesc = "Conformance Class 'GML application schema, Protected Sites'";
			if (testSuiteId == "EID4c53a8c7-7cac-4531-982b-d03eb48ffa77") testSuiteDesc = "Conformance Class 'Application schema, Protected Sites Simple'";
			if (testSuiteId == "EID7831c8b4-f666-4534-838a-137b30bfecbe") testSuiteDesc = "Conformance Class 'Data consistency, Protected Sites'";
			if (testSuiteId == "EIDb529e8fa-b9f8-4758-acea-1d2af744599f") testSuiteDesc = "Conformance Class 'Information accessibility, Protected Sites'";
			if (testSuiteId == "EID828410c1-53f2-4683-bded-481ad9d4d3e9") testSuiteDesc = "Conformance Class 'Reference systems, Protected Sites'";
			if (testSuiteId == "EID9af1c865-1cf0-43ff-9250-069df01b0948") testSuiteDesc = "Conformance Class 'GML application schemas, Transport Networks'";
			if (testSuiteId == "EID4441cbde-371f-4899-90b3-145f4fd08ebc") testSuiteDesc = "Conformance Class 'Application schema, Transport Networks Common'";
			if (testSuiteId == "EID6800c834-b4e0-4631-9209-73530fb9ccee") testSuiteDesc = "Conformance Class 'Application schema, Air Transport Networks'";
			if (testSuiteId == "EID733af9a0-312b-4f71-9aa2-977cd2134d23") testSuiteDesc = "Conformance Class 'Data consistency, Transport Networks'";
			if (testSuiteId == "EIDdf5db9a4-b15f-4193-a6ff-6e9951af46f5") testSuiteDesc = "Conformance Class 'Information accessibility, Transport Networks'";
			if (testSuiteId == "EID9d35024d-9dd7-43a9-afff-d5aea5f51595") testSuiteDesc = "Conformance Class 'Reference systems, Transport Networks'";
			if (testSuiteId == "EID9af1c865-1cf0-43ff-9250-069df01b0948") testSuiteDesc = "Conformance Class 'GML application schemas, Transport Networks'";
			if (testSuiteId == "EID4441cbde-371f-4899-90b3-145f4fd08ebc") testSuiteDesc = "Conformance Class 'Application schema, Transport Networks Common'";
			if (testSuiteId == "EID731621b9-2daa-49fd-99ef-9279b7f335b5") testSuiteDesc = "Conformance Class 'Application schema, Cable Transport Networks'";
			if (testSuiteId == "EID733af9a0-312b-4f71-9aa2-977cd2134d23") testSuiteDesc = "Conformance Class 'Data consistency, Transport Networks'";
			if (testSuiteId == "EIDdf5db9a4-b15f-4193-a6ff-6e9951af46f5") testSuiteDesc = "Conformance Class 'Information accessibility, Transport Networks'";
			if (testSuiteId == "EID9d35024d-9dd7-43a9-afff-d5aea5f51595") testSuiteDesc = "Conformance Class 'Reference systems, Transport Networks'";
			if (testSuiteId == "EID9af1c865-1cf0-43ff-9250-069df01b0948") testSuiteDesc = "Conformance Class 'GML application schemas, Transport Networks'";
			if (testSuiteId == "EID4441cbde-371f-4899-90b3-145f4fd08ebc") testSuiteDesc = "Conformance Class 'Application schema, Transport Networks Common'";
			if (testSuiteId == "EIDe2610a9f-6432-489d-8238-92b1193e7a3d") testSuiteDesc = "Conformance Class 'Application schema, Rail Transport Networks'";
			if (testSuiteId == "EID733af9a0-312b-4f71-9aa2-977cd2134d23") testSuiteDesc = "Conformance Class 'Data consistency, Transport Networks'";
			if (testSuiteId == "EIDdf5db9a4-b15f-4193-a6ff-6e9951af46f5") testSuiteDesc = "Conformance Class 'Information accessibility, Transport Networks'";
			if (testSuiteId == "EID9d35024d-9dd7-43a9-afff-d5aea5f51595") testSuiteDesc = "Conformance Class 'Reference systems, Transport Networks'";
			if (testSuiteId == "EID9af1c865-1cf0-43ff-9250-069df01b0948") testSuiteDesc = "Conformance Class 'GML application schemas, Transport Networks'";
			if (testSuiteId == "EID4441cbde-371f-4899-90b3-145f4fd08ebc") testSuiteDesc = "Conformance Class 'Application schema, Transport Networks Common'";
			if (testSuiteId == "EID14986e54-74c4-43b0-979b-d0d3e5cd0e8c") testSuiteDesc = "Conformance Class 'Application schema, Road Transport Networks'";
			if (testSuiteId == "EID733af9a0-312b-4f71-9aa2-977cd2134d23") testSuiteDesc = "Conformance Class 'Data consistency, Transport Networks'";
			if (testSuiteId == "EIDdf5db9a4-b15f-4193-a6ff-6e9951af46f5") testSuiteDesc = "Conformance Class 'Information accessibility, Transport Networks'";
			if (testSuiteId == "EID9d35024d-9dd7-43a9-afff-d5aea5f51595") testSuiteDesc = "Conformance Class 'Reference systems, Transport Networks'";
			if (testSuiteId == "EID9af1c865-1cf0-43ff-9250-069df01b0948") testSuiteDesc = "Conformance Class 'GML application schemas, Transport Networks'";
			if (testSuiteId == "EID4441cbde-371f-4899-90b3-145f4fd08ebc") testSuiteDesc = "Conformance Class 'Application schema, Transport Networks Common'";
			if (testSuiteId == "EIDeb35a20f-188d-4fd3-aee1-dd07eb3c3efa") testSuiteDesc = "Conformance Class 'Application schema, Water Transport Networks'";
			if (testSuiteId == "EID733af9a0-312b-4f71-9aa2-977cd2134d23") testSuiteDesc = "Conformance Class 'Data consistency, Transport Networks'";
			if (testSuiteId == "EIDdf5db9a4-b15f-4193-a6ff-6e9951af46f5") testSuiteDesc = "Conformance Class 'Information accessibility, Transport Networks'";
			if (testSuiteId == "EID9d35024d-9dd7-43a9-afff-d5aea5f51595") testSuiteDesc = "Conformance Class 'Reference systems, Transport Networks'";

			if (testSuiteId == "EIDd1d0409d-d60f-4c95-8efd-83149b47f10f") testSuiteDesc = "Conformance Class 'Conformance Class 'GML application schemas, Land Cover'";
			if (testSuiteId == "EID6495f817-cfa0-4bb9-9f45-811c59a4d691") testSuiteDesc = "Conformance Class 'Application Schema, Land Cover Nomenclature'";
			if (testSuiteId == "EIDcb4bc4b6-eea1-4de3-a55b-c82a90724e12") testSuiteDesc = "Conformance Class 'Application Schema, Land Cover Raster'";
			if (testSuiteId == "EIDf67a480e-616b-4cd5-b94b-8b729dfaae27") testSuiteDesc = "Conformance Class 'Conformance Class 'Data consistency, Land Cover'";
			if (testSuiteId == "EIDf9b9c323-4a77-4417-ac30-c1c532d7baf9") testSuiteDesc = "Conformance Class 'Information accessibility, Land Cover'";
			if (testSuiteId == "EIDadbb8d1c-4da0-4dda-a2c0-0b1f5b8113bb") testSuiteDesc = "Conformance Class 'Reference systems, Land Cover'";

			if (testSuiteId == "EIDe0c5fb24-9216-40b1-951e-6188b4c43c6c") testSuiteDesc = "Conformance Class 'Application Schema, Land Cover Vector'";

			if (testSuiteId == "EID39f95104-d438-4462-a9d6-6e9ae25b261c") testSuiteDesc = "Conformance Class 'Reference systems, Area Management, Restriction/Regulation Zones and Reporting Units'";
			if (testSuiteId == "EIDf55d5e5a-e6be-4ab7-85b8-d8fedc129c65") testSuiteDesc = "Conformance Class 'Information accessibility, Area Management, Restriction/Regulation Zones and Reporting Units'";
			if (testSuiteId == "EIDf104fc10-9445-11ea-bb37-0242ac130002") testSuiteDesc = "Conformance Class 'Data consistency, Area Management, Restriction/Regulation Zones and Reporting Units'";
			if (testSuiteId == "EIDbc6635ae-84a6-11ea-bc55-0242ac130003") testSuiteDesc = "Conformance Class 'Application schema, Area Management, Restriction/Regulation Zones and Reporting Units'";
			if (testSuiteId == "EID0f7a4498-83bb-11ea-bc55-0242ac130003") testSuiteDesc = "Conformance Class 'GML application schemas, Area Management, Restriction/Regulation Zones and Reporting Units'";

			if (testSuiteId == "EID4f7e4a81-3bab-4058-b528-afec8d6e980d") testSuiteDesc = "Conformance Class 'GML application schemas, Buildings'";
			if (testSuiteId == "EIDeab289c0-47c0-4b4f-bd11-1f49ecd21878") testSuiteDesc = "Conformance Class 'Application Schema, BuildingsBase'";
			if (testSuiteId == "EIDcdb18aec-6d6f-48cf-90d9-c6472a0883cd") testSuiteDesc = "Conformance Class 'Application Schema, Buildings2D'";
			if (testSuiteId == "EID22fd29c0-97a2-48d0-89e9-ef92e59eb5ca") testSuiteDesc = "Conformance Class 'Data consistency, Buildings'";
			if (testSuiteId == "EID519a1f46-1e52-4a86-8d53-23fb39000665") testSuiteDesc = "Conformance Class 'Information accessibility, Buildings'";
			if (testSuiteId == "EID32fda995-1c2e-4a62-ab3b-d0fca47ecc8b") testSuiteDesc = "Conformance Class 'Reference systems, Buildings'";

			if (testSuiteId == "EID94fdd1a9-68bf-4a0a-aa89-76659436a676") testSuiteDesc = "Conformance Class 'GML application schemas, Buildings (For BU3D)'";
			if (testSuiteId == "EID45e5267c-ab6e-4bb7-a6b3-ee7b7ec5e053") testSuiteDesc = "Conformance Class 'Application Schema, BuildingsBase (For BU3D)'";
			if (testSuiteId == "EID97868e65-3205-4dae-be56-651278005ccc") testSuiteDesc = "Conformance Class 'Application Schema, Buildings3D'";
			if (testSuiteId == "EID22fd29c0-97a2-48d0-89e9-ef92e59eb5ca") testSuiteDesc = "Conformance Class 'Data consistency, Buildings'";
			if (testSuiteId == "EID519a1f46-1e52-4a86-8d53-23fb39000665") testSuiteDesc = "Conformance Class 'Information accessibility, Buildings'";
			if (testSuiteId == "EID32fda995-1c2e-4a62-ab3b-d0fca47ecc8b") testSuiteDesc = "Conformance Class 'Reference systems, Buildings'";

			if (testSuiteId == "EIDe5722015-702d-40a6-8279-78428d3ca1a7") testSuiteDesc = "Conformance Class 'Reference systems, Environmental Monitoring Facilities'";
			if (testSuiteId == "EIDc043fc5e-723e-4982-a10c-feb352c934fb") testSuiteDesc = "Conformance Class 'Information accessibility, Environmental Monitoring Facilities'";
			if (testSuiteId == "EID80cb9b2a-a487-4d0f-afa6-337eb387996b") testSuiteDesc = "Conformance Class 'Data consistency, Environmental Monitoring Facilities'";
			if (testSuiteId == "EIDe2bf686d-a8bd-4cfd-b02b-dc902e910b37") testSuiteDesc = "Conformance Class 'Application schema, Environmental Monitoring Facilities'";
			if (testSuiteId == "EID7f414964-eafa-499e-950b-b93d0c2d691b") testSuiteDesc = "Conformance Class 'GML application schemas, Environmental Monitoring Facilities'";

			if (testSuiteId == "EID3db69eef-77dc-4a16-8a0a-aed7f97e2eb5") testSuiteDesc = "Conformance Class 'Reference systems, Habitats and Biotopes'";
			if (testSuiteId == "EID4b42762d-46e9-4807-9eb0-584a41f75b79") testSuiteDesc = "Conformance Class 'Information accessibility, Habitats and Biotopes'";
			if (testSuiteId == "EID3b5f31e2-f75f-4127-a5db-81b6b64fd06c") testSuiteDesc = "Conformance Class 'Data consistency, Habitats and Biotopes'";
			if (testSuiteId == "EIDdc4332a0-e79e-4e15-a9f6-32425fb1389c") testSuiteDesc = "Conformance Class 'Application Schema, Habitats and Biotopes'";
			if (testSuiteId == "EID1c48f426-e247-4a87-aa94-4336e17bc492") testSuiteDesc = "Conformance Class 'GML application schemas, Habitats and Biotopes'";

			if (testSuiteId == "EIDdbbf0296-ee64-411e-9c22-3936136fec51") testSuiteDesc = "Conformance Class 'Reference systems, Human Health and Safety'";
			if (testSuiteId == "EID3743813e-6dda-4d25-8600-27bcc608a8c7") testSuiteDesc = "Conformance Class 'Information accessibility, Human Health and Safety'";
			if (testSuiteId == "EID716281da-f3ab-4d8f-8221-78e489d48b64") testSuiteDesc = "Conformance Class 'Data consistency, Human Health and Safety'";
			if (testSuiteId == "EID41be0eb2-c9cd-47f7-8e47-18d2622bd26a") testSuiteDesc = "Conformance Class 'Application Schema, Human Health and Safety'";
			if (testSuiteId == "EID1e5b036c-e041-4721-ae47-f1a8842970db") testSuiteDesc = "Conformance Class 'GML application schemas, Human Health and Safety'";

			if (testSuiteId == "EIDdbbf0296-ee64-411e-9c22-3936136fec51") testSuiteDesc = "Conformance Class 'Reference systems, Human Health and Safety'";
			if (testSuiteId == "EID3743813e-6dda-4d25-8600-27bcc608a8c7") testSuiteDesc = "Conformance Class 'Information accessibility, Human Health and Safety'";
			if (testSuiteId == "EID716281da-f3ab-4d8f-8221-78e489d48b64") testSuiteDesc = "Conformance Class 'Data consistency, Human Health and Safety'";
			if (testSuiteId == "EID41be0eb2-c9cd-47f7-8e47-18d2622bd26a") testSuiteDesc = "Conformance Class 'Application Schema, Human Health and Safety'";
			if (testSuiteId == "EID1e5b036c-e041-4721-ae47-f1a8842970db") testSuiteDesc = "Conformance Class 'GML application schemas, Human Health and Safety'";

			if (testSuiteId == "EID0163e019-90b6-4dd9-8c9c-d2d1d7fc5f69") testSuiteDesc = "Conformance Class 'GML application schemas, Land Use'";
			if (testSuiteId == "EIDa3ffd06a-5652-4719-8707-13f738747a8c") testSuiteDesc = "Conformance Class 'Application schema, Existing Land Use'";
			if (testSuiteId == "EID9251e31c-1318-4f52-afe5-900eb16f5647") testSuiteDesc = "Conformance Class 'Data consistency, Land Use'";
			if (testSuiteId == "EIDa4bf4091-b26d-4e13-ab94-4d26ea10a625") testSuiteDesc = "Conformance Class 'Information accessibility, Land Use'";
			if (testSuiteId == "EIDda4c0f98-f97a-44ad-9366-cef577cf809a") testSuiteDesc = "Conformance Class 'Reference systems, Land Use'";

			if (testSuiteId == "EID6fcca21c-fba1-4fe5-b2f0-d6aa1be45d67") testSuiteDesc = "Conformance Class 'Application schema, Gridded Existing Land Use'";

			if (testSuiteId == "EIDeefb2267-a0ca-40b4-87ee-a286ff6dd97f") testSuiteDesc = "Conformance Class 'Application schema, Planned Land Use'";

			if (testSuiteId == "EIDba63bc6d-c67c-48b1-b7ee-654e6fffa0bd") testSuiteDesc = "Conformance Class 'Application schema, Sampled Existing Land Use'";

			if (testSuiteId == "EIDeca530d8-a4c0-421a-b1c3-4409fe31e10b") testSuiteDesc = "Conformance Class 'GML application schema, Natural Risk Zones'";
			if (testSuiteId == "EID5aab5d8a-e432-47dd-b072-7cbf520035be") testSuiteDesc = "Conformance Class 'Application Schema, Natural Risk Zones'";
			if (testSuiteId == "EIDc1386fc3-eb79-41dc-a2ff-9ca48e0576eb") testSuiteDesc = "Conformance Class 'Data consistency, Natural Risk Zones'";
			if (testSuiteId == "EIDe3d08307-45ad-4797-9074-ced0147797b5") testSuiteDesc = "Conformance Class 'Information accessibility, Natural Risk Zones'";
			if (testSuiteId == "EIDf62fe181-52f2-4212-b925-fc7ac8bfb2a1") testSuiteDesc = "Conformance Class 'Reference systems, Natural Risk Zones'";

			if (testSuiteId == "EIDe58828f5-8627-42da-9af9-6bf6aef93670") testSuiteDesc = "Conformance Class 'GML application schemas, Population Distribution'";
			if (testSuiteId == "EID3c3f870f-7727-4e1d-bd84-dd93cf55df73") testSuiteDesc = "Conformance Class 'Application Schema, Population Distribution'";
			if (testSuiteId == "EID9f025400-9f65-4916-92ed-a99db86f014c") testSuiteDesc = "Conformance Class 'Data consistency, Population Distribution'";
			if (testSuiteId == "EID81d6a9b3-508e-4164-9d66-449cdf383f90") testSuiteDesc = "Conformance Class 'Information accessibility, Population Distribution'";
			if (testSuiteId == "EIDc6b969f1-c2a8-4335-bc28-2ae8ee0fe20c") testSuiteDesc = "Conformance Class 'Reference systems, Population Distribution'";

			if (testSuiteId == "EID0c7efa5c-1628-4ee6-a670-726e7ebf8feb") testSuiteDesc = "Conformance Class 'GML application schema, Production and Industrial Facilities'";
			if (testSuiteId == "EIDe0956e54-bac0-4273-ba55-150b5cf37627") testSuiteDesc = "Conformance Class 'Application schema, Production and Industrial Facilities'";
			if (testSuiteId == "EIDc4ed72f4-c06a-4deb-a9ee-5d3bfa8a0423") testSuiteDesc = "Conformance Class 'Data consistency, Production and Industrial Facilities'";
			if (testSuiteId == "EID11b40303-35ce-4e23-bebd-f97a026daf3d") testSuiteDesc = "Conformance Class 'Information accessibility, Production and Industrial Facilities'";
			if (testSuiteId == "EIDf2f51782-2f19-410b-ad4d-163a76f79043") testSuiteDesc = "Conformance Class 'Reference systems, Production and Industrial Facilities'";

			if (testSuiteId == "EIDbfc36eb3-18f0-4284-9dae-6159f59866bc") testSuiteDesc = "Conformance Class 'GML application schemas, Sea Regions'";
			if (testSuiteId == "EID793a9c8e-c24a-4b90-ad1e-9a5f12339d7a") testSuiteDesc = "Conformance Class 'Application schema, Sea Regions'";
			if (testSuiteId == "EID80294b80-ac86-479d-a2cd-af07878c508a") testSuiteDesc = "Conformance Class 'Data consistency, Sea Regions'";
			if (testSuiteId == "EIDe1fd673d-7c18-44af-a59c-a95f44a82a8a") testSuiteDesc = "Conformance Class 'Information accessibility, Sea Regions'";
			if (testSuiteId == "EID3ff69f66-15f7-4e67-b75f-342d96866332") testSuiteDesc = "Conformance Class 'Reference systems, Sea Regions'";

			if (testSuiteId == "EID42d4a7f6-361d-49c5-b88e-0a456908707e") testSuiteDesc = "Conformance Class 'GML application schemas, Species Distribution'";
			if (testSuiteId == "EID4a6ad3fe-8ae8-467e-a6e4-aef6bdff8a66") testSuiteDesc = "Conformance Class 'Application schema, Species Distribution'";
			if (testSuiteId == "EID069ca302-e21c-4727-93db-0b79ebef88fb") testSuiteDesc = "Conformance Class 'Data consistency, Species Distribution'";
			if (testSuiteId == "EIDc7ec6434-6d55-4ec4-bf48-5c5dd5760a53") testSuiteDesc = "Conformance Class 'Information accessibility, Species Distribution'";
			if (testSuiteId == "EIDeed6bc26-210e-4280-9346-9b5ac9850e41") testSuiteDesc = "Conformance Class 'Reference systems, Species Distribution'";

			if (testSuiteId == "EIDa29e2923-f49c-4b51-84ce-fff856027448") testSuiteDesc = "Conformance Class 'GML application schemas, Elevation'";
			if (testSuiteId == "EID8756ae77-c118-4bfe-8133-2020ff344fb3") testSuiteDesc = "Conformance Class 'Application Schema, Elevation Base Types'";
			if (testSuiteId == "EID6b5cfe6b-f72a-4fec-8d77-036d9fb41dcd") testSuiteDesc = "Conformance Class 'Application Schema, Elevation Grid Coverage'";
			if (testSuiteId == "EID35fe82ad-e02c-42d3-bc36-c14d0ac2b508") testSuiteDesc = "Conformance Class 'Data consistency, Elevation'";
			if (testSuiteId == "EID0db5c897-46df-4d6d-926d-434d9f23963a") testSuiteDesc = "Conformance Class 'Information accessibility, Elevation'";
			if (testSuiteId == "EID2d8c64ab-c402-4fae-af50-84e7803d42e2") testSuiteDesc = "Conformance Class 'Reference systems, Elevation'";

			if (testSuiteId == "EID658d0b59-5f43-429b-a882-b27025f31c1a") testSuiteDesc = "Conformance Class 'Application Schema, Elevation TIN'";

			if (testSuiteId == "EID745ac51c-50d1-4854-95c7-1e7a8f09e7ae") testSuiteDesc = "Conformance Class 'Application Schema, Elevation Vector Elements'";

			if (testSuiteId == "EID5ff0b3a6-d3b3-473f-941f-35f08f9418b1") testSuiteDesc = "Conformance Class 'GML application schemas, Geology'";
			if (testSuiteId == "EID6ccde16b-c593-4f2c-b69c-497f92cdc544") testSuiteDesc = "Conformance Class 'Application Schema, Geology'";
			if (testSuiteId == "EIDa3416537-7350-4d7f-be33-694c83fef287") testSuiteDesc = "Conformance Class 'Data consistency, Geology'";
			if (testSuiteId == "EID50cf0786-dc31-481a-bef7-3a6cde0f34d6") testSuiteDesc = "Conformance Class 'Information accessibility, Geology'";
			if (testSuiteId == "EIDef6e011f-7aac-43eb-91b3-30f95632c3ab") testSuiteDesc = "Conformance Class 'Reference systems, Geology'";

			if (testSuiteId == "EIDe7376545-7848-4e62-8ba0-581451828830") testSuiteDesc = "Conformance Class 'Application Schema, Geophysics'";

			if (testSuiteId == "EID0073dac9-bed1-4f2f-8644-19e0e42f7ede") testSuiteDesc = "Conformance Class 'Application Schema, Hydrogeology'";

			if (testSuiteId == "EIDaa467ffe-2837-4e62-baba-09f9fcfd2600") testSuiteDesc = "Conformance Class 'GML application schemas, Bio-geographical Regions'";
			if (testSuiteId == "EID01d98e39-6f16-4f8c-b776-6a2ce81efeba") testSuiteDesc = "Conformance Class 'Application Schema, Bio-geographical Regions'";
			if (testSuiteId == "EID8aa895c0-a43a-40bb-85c7-479f66d24630") testSuiteDesc = "Conformance Class 'Data consistency, Bio-geographical Regions'";
			if (testSuiteId == "EID973da927-87eb-42b2-b549-477b9ee5d0bb") testSuiteDesc = "Conformance Class 'Information accessibility, Bio-geographical Regions'";
			if (testSuiteId == "EID0dc28d32-e8cf-448d-a30d-8c3ba3a1252e") testSuiteDesc = "Conformance Class 'Reference systems, Bio-geographical Regions'";

			if (testSuiteId == "EID59c0e67e-4add-40a8-aee2-78c8fb5d2618") testSuiteDesc = "Conformance Class 'GML application schemas, Utility and Government Services'";
			if (testSuiteId == "EID127eed5c-621d-4bbe-8633-cdc21c25d664") testSuiteDesc = "Conformance Class 'Application schema, Common Utility Network'";
			if (testSuiteId == "EID042b6fb7-14ea-42b9-81df-3c1fdf8a960c") testSuiteDesc = "Conformance Class 'Application schema, Administrative And Social Governmental Services'";
			if (testSuiteId == "EID8663f6c2-beef-4118-b8fc-67bcca0b2885") testSuiteDesc = "Conformance Class 'Data consistency, Utility and Government Services'";
			if (testSuiteId == "EID7b22de70-15f8-4b83-aba1-cc8f3ce59aa5") testSuiteDesc = "Conformance Class 'Information accessibility, Utility and Government Services'";
			if (testSuiteId == "EIDa52ff667-7079-40c8-941a-5f3f918825af") testSuiteDesc = "Conformance Class 'Reference systems, Utility and Government Services'";

			if (testSuiteId == "EIDc69d4020-0305-422e-a7d9-46f7966fd789") testSuiteDesc = "Conformance Class 'Application schema, Electricity Network'";

			if (testSuiteId == "EID955c8cf0-0608-4586-9866-316766d79bc1") testSuiteDesc = "Conformance Class 'Application schema, Environmental Management Facilities'";

			if (testSuiteId == "EIDdf1616e0-04f3-4662-baa7-4fe88ac94035") testSuiteDesc = "Conformance Class 'Application schema, Oil-Gas-Chemicals Network'";

			if (testSuiteId == "EID9222fa32-a20b-4792-8945-6dcabd912654") testSuiteDesc = "Conformance Class 'Application schema, Sewer Network'";

			if (testSuiteId == "EID5a3043d1-ba13-4423-838a-c487e22653d3") testSuiteDesc = "Conformance Class 'Application schema, Thermal Network'";

			if (testSuiteId == "EIDb64a59e3-5187-4279-801d-fe78e0a79e7a") testSuiteDesc = "Conformance Class 'Application schema, Water Network'";

			if (testSuiteId == "EIDd718e45d-8cdb-4876-957a-51a35ba9fafa") testSuiteDesc = "Conformance class: 'Application Schema, Agricultural and Aquaculture Facilities'";
			if (testSuiteId == "EID1ca3be4d-1953-45c7-960c-4e87dd1bc487") testSuiteDesc = "Conformance class: 'Data consistency, Agricultural and Aquaculture Facilities'";
			if (testSuiteId == "EID2e792ebf-e98e-42d3-850d-80bbb0b568b9") testSuiteDesc = "Conformance class: 'GML application schemas, Agricultural and Aquaculture Facilities'";
			if (testSuiteId == "EID36dec890-a302-442e-ae35-1edcfa5ca4dd") testSuiteDesc = "Conformance class: 'Information accessibility, Agricultural and Aquaculture Facilities'";
			if (testSuiteId == "EID2d2491df-b01e-4527-a089-82d6ffa88a80") testSuiteDesc = "Conformance class: 'Reference systems, Agricultural and Aquaculture Facilities'";

			if (testSuiteId == "EID7bc56fcd-d29d-4a71-b6d1-c283e6b63b2c") testSuiteDesc = "Conformance Class 'GML application schemas, Atmospheric Conditions and Meteorological Geographical Features'";
			if (testSuiteId == "EID850a0120-7637-4aef-84aa-5673832e518a") testSuiteDesc = "Conformance Class 'Application schema, Atmospheric Conditions and Meteorological Geographical Features'";
			if (testSuiteId == "EID8736653c-eee8-4546-a802-ec62f1792262") testSuiteDesc = "Conformance Class 'Data consistency, Atmospheric Conditions and Meteorological Geographical Features'";
			if (testSuiteId == "EIDac70176c-224c-47ea-864a-b53344a2dec8") testSuiteDesc = "Conformance Class 'Information accessibility, Atmospheric Conditions and Meteorological Geographical Features'";
			if (testSuiteId == "EIDe714b79c-6219-4177-acb3-e01ac8f4549d") testSuiteDesc = "Conformance Class 'Reference systems, Atmospheric Conditions and Meteorological Geographical Features'";

			if (testSuiteId == "EID46af85e3-f8cc-4812-b8b7-36d99897084c") testSuiteDesc = "Conformance class: 'Application schema, Orthoimagery'";
			if (testSuiteId == "EIDdd6d5c5f-6d38-45a1-b85d-b9f2606bff2d") testSuiteDesc = "Conformance class: 'Data consistency, Orthoimagery'";
			if (testSuiteId == "EID2151146d-da46-4242-9471-0918db59abb5") testSuiteDesc = "Conformance class: 'GML application schemas, Orthoimagery'";
			if (testSuiteId == "EID3476ab51-fd62-4b19-a563-f3c05373c2ed") testSuiteDesc = "Conformance class: 'Information accessibility, Orthoimagery'";
			if (testSuiteId == "EID1b65c0d1-6374-4638-a489-86ba4d5c39d6") testSuiteDesc = "Conformance class: 'Reference systems, Orthoimagery'";

			if (testSuiteId == "EID1b45ee05-c7f1-471c-89a4-5e603ce3f056") testSuiteDesc = "Conformance class: 'GML application schemas, Mineral Resources'";
			if (testSuiteId == "EIDda904b41-b762-4aca-8af4-204f427ba3e8") testSuiteDesc = "Conformance class: 'Application schema, Mineral Resources'";
			if (testSuiteId == "EIDd2d1c565-7bdb-4da5-b13b-5b1f14e6aed1") testSuiteDesc = "Conformance Class 'Data consistency, Mineral Resources'";
			if (testSuiteId == "EID0ac8bdce-710a-4287-92ca-6444cbbb2263") testSuiteDesc = "Conformance class: 'Information accessibility, Mineral Resources'";
			if (testSuiteId == "EIDcd930d18-2ad2-48d8-ac82-75f8af6733b6") testSuiteDesc = "Conformance Class 'Reference systems, Mineral Resources'";

			if (testSuiteId == "EID62825579-45ef-4ec3-8669-4f95a3ac60da") testSuiteDesc = "Conformance Class 'GML application schemas, Oceanographic geographical features'";
			if (testSuiteId == "EIDc030d752-2559-4ef2-9267-2d7d844720aa") testSuiteDesc = "Conformance Class 'Application Schema, Oceanographic geographical features'";
			if (testSuiteId == "EIDaaec0d06-e36d-41db-bc3c-b425466435e5") testSuiteDesc = "Conformance Class 'Data consistency, Oceanographic geographical features'";
			if (testSuiteId == "EID7f3dd0a4-a0af-4fd6-a507-fee53db7742d") testSuiteDesc = "Conformance Class 'Information accessibility, Oceanographic geographical features'";
			if (testSuiteId == "EID6827884c-c30d-464d-9ee7-3b9874b83c7f") testSuiteDesc = "Conformance Class 'Reference systems, Oceanographic geographical features'";

			if (testSuiteId == "EIDe009440c-e545-4227-9967-aff1b26f8c81") testSuiteDesc = "Conformance Class 'GML application schemas, Energy Resources'";
			if (testSuiteId == "EID9b6e3765-3744-40ee-98ec-243ac978915f") testSuiteDesc = "Conformance Class 'Application Schema, Energy Resources Base'";
			if (testSuiteId == "EID599aa296-6000-452f-9b97-18d0565f6b36") testSuiteDesc = "Conformance Class 'Application Schema, Energy Resources Coverage'";
			if (testSuiteId == "EIDfad66155-f16c-4e9a-8c6c-a010f3c6de11") testSuiteDesc = "Conformance Class 'Data consistency, Energy Resources'";
			if (testSuiteId == "EID018c7222-6d56-4b4b-8df3-ac511914fe85") testSuiteDesc = "Conformance Class 'Information accessibility, Energy Resources'";
			if (testSuiteId == "EIDb87f5e2e-72d8-40e5-a0fd-34e3829f9426") testSuiteDesc = "Conformance Class 'Reference systems, Energy Resources'";

			if (testSuiteId == "EID0901c212-8b06-4c29-b648-c411678b9369") testSuiteDesc = "Conformance Class 'Application Schema, Energy Resources Vector'";

			return testSuiteDesc;
		}
	}

	$scope.dynamicSort = function(property, order) {
		var sortOrder = 1;
		if (property[0] === "-") {
			sortOrder = -1;
			property = property.substr(1);
		}
		return function(a, b) {
			if (order == "ASC") var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
			if (order == "DESC") var result = (a[property] > b[property]) ? -1 : (a[property] < b[property]) ? 1 : 0;
			if ($("#sortByDate").attr("aria-expanded") == "true") {
				$("#sortByDate").click();
				$scope.searchParameters.currPage = 1;
				$scope.updateResultsLimit();
			}
			return result * sortOrder;
		}
	}

	$scope.sortTestResults = function(field, order) {
		if (field != "default") {
			if (Array.isArray($scope.testResults)) {
				$scope.testResults.sort($scope.dynamicSort(field, order));
			} else {
				var uniqueValue = $scope.testResults;
				$scope.testResults = [];
				$scope.testResults.push(uniqueValue);
			}
		}
		if (order == "ASC") {
			$("#sort_ascending").css("background-color", "#004494");
			$("#sort_ascending_label").css("color", "#ffffff");
			$("#sort_descending").css("background-color", "#ffffff");
			$("#sort_descending_label").css("color", "#000000");
		} else {
			$("#sort_ascending").css("background-color", "#ffffff");
			$("#sort_ascending_label").css("color", "#000000");
			$("#sort_descending").css("background-color", "#004494");
			$("#sort_descending_label").css("color", "#ffffff");
		}
	}

	$scope.cust = function() {
		return function(item) {
			var keyFound = false;
			if (($scope.searchParameters.searchedTerm.length == 0) && ($scope.searchParameters.resourceType == 'any') && ($scope.searchParameters.status == 'any')) {
				keyFound = true;
			} else {
				// Search terms on the description label
				if ($scope.searchParameters.searchedTerm.length > 0) {
					keyFoundTerms = false;
					var labelLowerCase = item.label.toLowerCase();
					keyFoundTerms0 = false;
					if (labelLowerCase.includes($scope.searchParameters.searchedTerm[0].toLowerCase()) == true) keyFoundTerms0 = true;
					if ($scope.searchParameters.searchedTerm.length > 1) {
						keyFoundTerms1 = false;
						if (labelLowerCase.includes($scope.searchParameters.searchedTerm[1].toLowerCase()) == true) keyFoundTerms1 = true;
					} else {
						keyFoundTerms1 = true;
					}
					if ($scope.searchParameters.searchedTerm.length > 2) {
						keyFoundTerms2 = false;
						if (labelLowerCase.includes($scope.searchParameters.searchedTerm[2].toLowerCase()) == true) keyFoundTerms2 = true;
					} else {
						keyFoundTerms2 = true;
					}
					if ($scope.searchParameters.searchedTerm.length > 3) {
						keyFoundTerms3 = false;
						if (labelLowerCase.includes($scope.searchParameters.searchedTerm[3].toLowerCase()) == true) keyFoundTerms3 = true;
					} else {
						keyFoundTerms3 = true;
					}
					if ($scope.searchParameters.searchedTerm.length > 4) {
						keyFoundTerms4 = false;
						if (labelLowerCase.includes($scope.searchParameters.searchedTerm[4].toLowerCase()) == true) keyFoundTerms4 = true;
					} else {
						keyFoundTerms4 = true;
					}
					if ($scope.searchParameters.searchedTerm.length > 5) {
						keyFoundTerms5 = false;
						if (labelLowerCase.includes($scope.searchParameters.searchedTerm[5].toLowerCase()) == true) keyFoundTerms5 = true;
					} else {
						keyFoundTerms5 = true;
					}
					if ($scope.searchParameters.searchedTerm.length > 6) {
						keyFoundTerms6 = false;
						if (labelLowerCase.includes($scope.searchParameters.searchedTerm[6].toLowerCase()) == true) keyFoundTerms6 = true;
					} else {
						keyFoundTerms6 = true;
					}
					if ($scope.searchParameters.searchedTerm.length > 7) {
						keyFoundTerms7 = false;
						if (labelLowerCasel.includes($scope.searchParameters.searchedTerm[7].toLowerCase()) == true) keyFoundTerms7 = true;
					} else {
						keyFoundTerms7 = true;
					}
					if ($scope.searchParameters.searchedTerm.length > 8) {
						keyFoundTerms8 = false;
						if (labelLowerCase.includes($scope.searchParameters.searchedTerm[8].toLowerCase()) == true) keyFoundTerms8 = true;
					} else {
						keyFoundTerms8 = true;
					}
					if ($scope.searchParameters.searchedTerm.length > 9) {
						keyFoundTerms9 = false;
						if (labelLowerCase.includes($scope.searchParameters.searchedTerm[9].toLowerCase()) == true) keyFoundTerms9 = true;
					} else {
						keyFoundTerms9 = true;
					}
					// Check AND
					if ($scope.searchParameters.searchedTermOperator == "AND") {
						if ((keyFoundTerms0) && (keyFoundTerms1) && (keyFoundTerms2) && (keyFoundTerms3) && (keyFoundTerms4) && (keyFoundTerms5) && (keyFoundTerms6) && (keyFoundTerms7) && (keyFoundTerms8) && (keyFoundTerms9)) keyFoundTerms = true;
					}
					// Check OR
					if ($scope.searchParameters.searchedTermOperator == "OR") {
						if ((keyFoundTerms0) || (keyFoundTerms1) || (keyFoundTerms2) || (keyFoundTerms3) || (keyFoundTerms4) || (keyFoundTerms5) || (keyFoundTerms6) || (keyFoundTerms7) || (keyFoundTerms8) || (keyFoundTerms9)) keyFoundTerms = true;
					}
				} else {
					keyFoundTerms = true;
				}
				// Search by resource type
				if ($scope.searchParameters.resourceType != 'any') {
					keyFoundResources = false;
					if ($scope.searchParameters.resourceType == "metadata") var arrayTestSuiteId = ["EIDec7323d5-d8f0-4cfe-b23a-b826df86d58c", "EID9a31ecfc-6673-43c0-9a31-b4595fb53a98", "EID59692c11-df86-49ad-be7f-94a1e1ddd8da", "EIDe4a95862-9cc9-436b-9fdd-a0115d342350", "EID2be1480a-fe42-40b2-9420-eb0e69385c80", "EID59692c11-df86-49ad-be7f-94a1e1ddd8da", "EID8f869e23-c9e9-4e86-8dca-be30ff421229", "EID606587df-65a8-4b7b-9eee-e0d94daaa42a", "EID59692c11-df86-49ad-be7f-94a1e1ddd8da", "EID8f869e23-c9e9-4e86-8dca-be30ff421229", "EID8db54d8a-8578-4959-b891-5394d9f53a28", "EID7514777a-6cb8-499c-acd5-912496dc84e9", "EIDa593a7ad-42d9-46d0-985d-9dff3e684428"];
					if ($scope.searchParameters.resourceType == "viewservice") var arrayTestSuiteId = ["EIDeec9d674-d94b-4d8d-b744-1309c6cae1d2", "EID550ceacf-b3cb-47a0-b2dd-d3edb18344a9"];
					if ($scope.searchParameters.resourceType == "downloadservice") var arrayTestSuiteId = ["EIDed2d3501-d700-4ff9-b9bf-070dece8ddbd", "EID174edf55-699b-446c-968c-1892a4d8d5bd", "EID11571c92-3940-4f42-a6cd-5e2b1c6f4d93", "EID074570ad-d720-47b3-af79-d54201793404", "EID0ff73873-5601-41ff-8d92-3fb1fbba3cf2"];
					if ($scope.searchParameters.resourceType == "discoveryservice") var arrayTestSuiteId = ["EIDc837298f-a10e-42d1-88f2-f1415cbbb463"];
					if ($scope.searchParameters.resourceType == "dataset") var arrayTestSuiteId = ["EID545f9e49-009b-4114-9333-7ca26413b5d4", "EID61070ae8-13cb-4303-a340-72c8b877b00a", "EID09820daf-62b2-4fa3-a95f-56a0d2b7c4d8", "EID499937ea-0590-42d2-bd7a-1cafff35ecdb", "EID63f586f0-080c-493b-8ca2-9919427440cc", "EIDe6800faf-2e56-47df-831a-75a96b35f33d", "EID8aaef94b-6a4d-47ab-a5d0-70ad5cb28b08", "EID9c31fa6e-1fab-4345-bf29-6d2c129de312", "EID334bbd38-378d-4a44-8a19-5d00df919ec0", "EID6985a681-fd81-4448-83e8-061758b9ca8c", "EID47c569bc-677d-4ce3-8411-e2b29189332a", "EID117562c2-d6e1-4345-9f7b-cba229cf6685", "EIDacc5931c-4ff0-499f-b916-3cda1603456b", "EIDee28b75e-5c80-4370-838d-ab1b18e30b13", "EIDcafb75f8-5deb-4cca-89df-d3189322e97f", "EID18b742d0-15eb-421f-bbec-7c8c5cf7ee1a", "EID1f9bc92a-5879-4e9b-bcbe-1d2d0cab0aab", "EID92032cdb-db88-42aa-96c0-70a1af9e68b1", "EIDc4fbae00-3070-49fa-b803-24c66c31ac70", "EIDdbcc48ae-6871-4444-8e95-547bc22aacb2", "EID02b7b0cb-429a-4f4e-b0db-988464fb9496", "EID0fc46305-c623-422b-b7d7-251c3b86eb7f", "EIDa32f76c7-f1d3-4d70-83ef-d51d2545fa2e", "EIDc3379b85-853e-4a35-8c3d-b64191d94587", "EID1620bd27-b881-48a2-bf2b-301541e035f4", "EID81b070d3-b17f-430b-abee-456268346912", "EIDe008001b-5233-4081-a1ae-515d7702ce02", "EIDd0b58f38-98ae-43a8-a787-9a5084c60267", "EID893b7541-c9cb-4e0a-9f84-5d55cad1866c", "EID122b2f38-302f-4271-9653-69cf86fcb5c4", "EID81b070d3-b17f-430b-abee-456268346912", "EID45133c90-1929-405c-867d-9648b0620bf7", "EIDd0b58f38-98ae-43a8-a787-9a5084c60267", "EID893b7541-c9cb-4e0a-9f84-5d55cad1866c", "EID122b2f38-302f-4271-9653-69cf86fcb5c4", "EID8222c253-8468-4b94-a46b-2d1af1698a65", "EID4c53a8c7-7cac-4531-982b-d03eb48ffa77", "EID7831c8b4-f666-4534-838a-137b30bfecbe", "EIDb529e8fa-b9f8-4758-acea-1d2af744599f", "EID828410c1-53f2-4683-bded-481ad9d4d3e9", "EID9af1c865-1cf0-43ff-9250-069df01b0948", "EID4441cbde-371f-4899-90b3-145f4fd08ebc", "EID6800c834-b4e0-4631-9209-73530fb9ccee", "EID733af9a0-312b-4f71-9aa2-977cd2134d23", "EIDdf5db9a4-b15f-4193-a6ff-6e9951af46f5", "EID9d35024d-9dd7-43a9-afff-d5aea5f51595", "EID9af1c865-1cf0-43ff-9250-069df01b0948", "EID4441cbde-371f-4899-90b3-145f4fd08ebc", "EID731621b9-2daa-49fd-99ef-9279b7f335b5", "EID733af9a0-312b-4f71-9aa2-977cd2134d23", "EIDdf5db9a4-b15f-4193-a6ff-6e9951af46f5", "EID9d35024d-9dd7-43a9-afff-d5aea5f51595", "EID9af1c865-1cf0-43ff-9250-069df01b0948", "EID4441cbde-371f-4899-90b3-145f4fd08ebc", "EIDe2610a9f-6432-489d-8238-92b1193e7a3d", "EID733af9a0-312b-4f71-9aa2-977cd2134d23", "EIDdf5db9a4-b15f-4193-a6ff-6e9951af46f5", "EID9d35024d-9dd7-43a9-afff-d5aea5f51595", "EID9af1c865-1cf0-43ff-9250-069df01b0948", "EID4441cbde-371f-4899-90b3-145f4fd08ebc", "EID14986e54-74c4-43b0-979b-d0d3e5cd0e8c", "EID733af9a0-312b-4f71-9aa2-977cd2134d23", "EIDdf5db9a4-b15f-4193-a6ff-6e9951af46f5", "EID9d35024d-9dd7-43a9-afff-d5aea5f51595", "EID9af1c865-1cf0-43ff-9250-069df01b0948", "EID4441cbde-371f-4899-90b3-145f4fd08ebc", "EIDeb35a20f-188d-4fd3-aee1-dd07eb3c3efa", "EID733af9a0-312b-4f71-9aa2-977cd2134d23", "EIDdf5db9a4-b15f-4193-a6ff-6e9951af46f5", "EID9d35024d-9dd7-43a9-afff-d5aea5f51595"];
					if (Array.isArray(item.testTasks.TestTask) == false) {
						var resourceType = item.testTasks.TestTask.executableTestSuite.href;
						resourceType = resourceType.replace("//v2", "/v2");
						resourceType = resourceType.replace($scope.urlRealValidator + "ExecutableTestSuites/", "");
						resourceType = resourceType.replace(".json", "");
						resourceType = "EID" + resourceType;
						if (arrayTestSuiteId.includes(resourceType)) keyFoundResources = true;
					} else {
						var numTestSuites = item.testTasks.TestTask.length;
						for (var i = 0; i < numTestSuites; i++) {
							var resourceType = item.testTasks.TestTask[i].executableTestSuite.href;
							resourceType = resourceType.replace("//v2", "/v2");
							resourceType = resourceType.replace($scope.urlRealValidator + "ExecutableTestSuites/", "");
							resourceType = resourceType.replace(".json", "");
							resourceType = "EID" + resourceType;
							if (arrayTestSuiteId.includes(resourceType)) keyFoundResources = true;
						}
					}
				} else {
					keyFoundResources = true;
				}
				// Search by resource status
				if ($scope.searchParameters.status != 'any') {
					keyFoundStatus = false;
					var status = "none";
					if ($scope.searchParameters.status == "failed") status = "FAILED";
					if ($scope.searchParameters.status == "passed") status = "PASSED";
					if ($scope.searchParameters.status == "passedmanual") status = "PASSED_MANUAL";
					if ($scope.searchParameters.status == "warning") status = "INTERNAL_ERROR";
					if ($scope.searchParameters.status == "undefined") status = "UNDEFINED";
					if ($scope.searchParameters.status == "running") status = "RUNNING";
					if (item.status == status) keyFoundStatus = true;
				} else {
					keyFoundStatus = true;
				}

				if ((keyFoundTerms == true) && (keyFoundResources == true) && (keyFoundStatus == true)) {
					keyFound = true;
				} else {
					keyFound = false;
				}
			}
			$scope.searchParameters.numPages = $scope.roundNumber($scope.filtered.length / $scope.searchParameters.pageSize);
			if (keyFound == true) {
				return "Found";
			} else {
				return undefined;
			}
		}
	}

	$scope.refineResults = function() {
		var searchText = $("#text-input-search-id").val();
		if (searchText == "") {
			$scope.searchParameters.searchedTerm = [];
			$scope.searchParameters.searchedTermOperator = "AND";
		} else {
			$scope.searchParameters.searchedTerm = searchText.split(" ");
			if ($("#radio-binary-1").is(':checked')) $scope.searchParameters.searchedTermOperator = "AND";
			if ($("#radio-binary-2").is(':checked')) $scope.searchParameters.searchedTermOperator = "OR";
		}
		console.log($scope.searchParameters.searchedTerm);
		console.log($scope.searchParameters.searchedTermOperator);
		$scope.searchParameters.resourceType = $("#facet-resource").val();
		$scope.searchParameters.status = $("#facet-status").val();
		$scope.searchParameters.currPage = 1;
		for (var x = 0; x < $scope.testResults.length; x++) {
			$("#testDetail_" + $scope.testResults[x].id).addClass("detailHidden")
			$("#expander_" + $scope.testResults[x].id).text("+");
		}
		$scope.updateResultsLimit();
	}

	$scope.clearAll = function() {
		$("#text-input-search-id").val("");
		$("#facet-resource").val('any');
		$("#facet-status").val('any');
		$scope.searchParameters.searchedTerm = [];
		$scope.searchParameters.resourceType = "any";
		$scope.searchParameters.status = "any";
		$scope.searchParameters.currPage = 1;
		for (var x = 0; x < $scope.testResults.length; x++) {
			$("#testDetail_" + $scope.testResults[x].id).addClass("detailHidden")
			$("#expander_" + $scope.testResults[x].id).text("+");
		}
		$scope.updateResultsLimit();
	}

	$scope.removeTerm = function(term) {
		$scope.searchParameters.searchedTerm = jQuery.grep($scope.searchParameters.searchedTerm, function(value) {
			return value != term;
		});
		var newSearchText = $scope.searchParameters.searchedTerm.join(" ");
		$("#text-input-search-id").val(newSearchText);
		$scope.searchParameters.currPage = 1;
		$scope.updateResultsLimit();
	}

	$scope.removeResourceType = function(resource) {
		$("#facet-resource").val('any');
		$scope.searchParameters.resourceType = $("#facet-resource").val();
		$scope.searchParameters.currPage = 1;
		$scope.updateResultsLimit();
	}

	$scope.removeStatus = function(status) {
		$("#facet-status").val('any');
		$scope.searchParameters.status = $("#facet-status").val();
		$scope.searchParameters.currPage = 1;
		$scope.updateResultsLimit();
	}


	// Load Test Runs
	$scope.readTestResults();

});