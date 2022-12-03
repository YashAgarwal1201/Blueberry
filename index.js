
// Some global declarations 
window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
const recognition = new window.SpeechRecognition();
const synthesis = window.speechSynthesis;

const greetMsg = 'Hello there, I am Blueberry. What is your name ?',
	errorMsg = 'Sorry but I coudn\'t understand what you just said.' 
var infoVar = '<h2>How-to-Use</h2>\
		<li>Press <i class="material-icons-outlined">campaign</i> button to login and start this Blueberry bot\
		<li>Press <i class="material-icons-outlined">mic</i> button to start speech recording\
		<li>Press <i class="material-icons-outlined">stop</i> button to stop recording speech\
		<li>For now only English language is supported\
		<li>Without Login you cannot use this bot',
	userLogin = null,	
	userPrompt = '<h2>User Prompt</h2>\
		<form type="POST" id="login-form-id" onsubmit="loginForm(event)">\
			<div class="fields">\
				<div class="c1">\
					<label>User Name</label><br>\
					<input type="text" name="Name" title="Click to Enter your User Name" autocomplete="off">\
				</div>\
				<div class="c2">\
					<label>Password</label><br>\
					<input type="password" name="Password" title="Click to Enter your Password" autocomplete="off">\
				</div>\
				<!--div class="c3">\
					<p>Not a Registered User? <a href="#">Register here</a>.</p>\
					<p>Forgot Password? <a href="#">Reset here</a>.</p>\
				</div-->\
			</div>\
			<div class="action-btn">\
				<button type="submit" title="Click to send your feedback"><i class="material-icons">send</i></button>\
				<button type="reset" title="Click to reset this form"><i class="material-icons">delete</i></button>\
			</div>\
		</form>',
	translateData = null,
	result			

// Speech Recognition Function 
function speechRecog (arg) {
	if ('SpeechRecognition' in window) {
		if (!userLogin || userLogin) {
			recognition.continuous = arg;
			
			recognition.onresult = (event) => {
				result = event.results[event.results.length -1][0].transcript;
				if (result.startsWith('undefined') || result.startsWith('undefined')) {
					result = result.replace('undefined',"");
				}
				$('#message-id').append('User: ' + result + '<br>');
			}
			
			if (arg) {
				recognition.start();
			}
			else {
				recognition.stop();
				console.log(recognition.lang)
				queryProcess(result);
			}
		}
		else 
			alert('please login')
	}
	else
		$('#output-id').text('speech not supported by your browser');
}

// Speech Speak Function 
function speechSpeak (arg) {
	if ('speechSynthesis' in window) {
		
		let utterance = new SpeechSynthesisUtterance(arg);
		//utterance.lang = recognition.lang//'en-US';

		if (arg) {
			synthesis.speak(utterance)
			$('#message-id').append('Bot: ' + arg + '<br>');
		}
	}
	else
		$('#output-id').text('speech synthesis not supported');
}

// function to process user's input query
function queryProcess(arg) {
	let queryProcessVariable = arg.toLowerCase()
	if (translateData) {

	}
	//queryProcessVariable = textProcess(queryProcessVariable)
	queryResult(queryProcessVariable)
}

// function to act according to user's query
function queryResult(argument) {
	let queryResultVariable = argument
	if (queryResultVariable.includes('say hello')) {
		speechSpeak('hello there, I am Blueberry.')
	}
	else if (queryResultVariable.includes('search')) {
		if (queryResultVariable.includes('google')) 
			window.open('https://google.com/search?q=' + queryResultVariable);
		else if (queryResultVariable.includes('yahoo'))
			window.open('https://yahoo.com/search?q=' + queryResultVariable)
		else {

		}
	}
	else if (queryResultVariable.includes('open my profile')) {
		window.open('https://agarwalyash.epizy.com/')
	}
	else if (queryResultVariable.includes('charging')) {
		batteryStat(queryResultVariable)
	}
	else if (queryResultVariable.includes('wikipedia')) {
		wikiSearch('javascript')
	}
	else if (queryResultVariable.includes('open url')) {
		let urlVar = prompt('Type the url starting with \'https://\' ')
		window.open(urlVar)
	}
	else {
		speechSpeak(errorMsg)
	}
}

function displayInfo(arg) {
	$('#results-id').slideDown()	
	$('#user-form-id').html(arg)	
}

function supportedVoice() {
	let voices = synthesis.getVoices();
	for (let i = 0; i < voices.length; i++) {
		console.log(voices[i])
	}
}
supportedVoice()

//function to show client's battery status (results may not be accurate)
function batteryStat(arg) {
	var batteryStatVar, batteryStatResult
	if ('getBattery' in navigator || ('battery' in navigator && 'Promise' in window)) {
		if('getBattery' in navigator)
			batteryStatVar = navigator.getBattery()
		else
			batteryStatVar = Promise.resolve(navigator.battery)

		batteryStatVar.then((battery) => {
			batteryStatResult = `<h2>Battery Status</h2>
				<p><strong>Note:</strong> Results may not be accurate</p>
				Battery Charging : ${battery.charging ? 'Yes' : 'No'}<br>
				Percentage : ${battery.level * 100}%<br>
				${battery.charging ? 'Time left for full charge : ' : 'Time remaining : '}
				${battery.charging ? battery.chargingTime : battery.dischargingTime} s<br>`
			displayInfo(batteryStatResult)
			if (arg == 'charging') {
				//$('#speak-btn').click(() => { speechSpeak(arg) }).trigger('click')
				batteryStatMsg = `Battery is ${battery.charging ? '' : 'Not'} charging. 
					Battery percentage is ${battery.level * 100}%.`
				speechSpeak(batteryStatMsg)
			}
		})
	}
	else {
		batteryStatResult = 'sorry but Battery Status API is not supported by the browser'
		displayInfo(batteryStatResult)
	}
}

// function to perform wikipedia search
function wikiSearch(arg) {
	let wikiSearchResult = ``
	var info = fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${arg}`)
	//WIKIPEDIA.getData(`http://en.wikipedia.org/wiki/${arg}`)
	info.then((res) => res.json()).then((argument) => {
		wikiSearchResult = `<h2>Wikipedia Search Results</h2>
			<content>
				<h3>${argument.title}</h3>
				<p>${argument.description}</p>
			</content>
			<content>
				<img src="${argument.originalimage.source}" 
					style="width: ${argument.thumbnail.width}px; 
							height: ${argument.thumbnail.height}px; margin: auto;" />
				<p>${argument.extract}</p>	
			</content>
			<a href="${argument.content_urls.desktop.page}" target="_blank">
				<u>Click to view Page</u> <i class="material-icons-outlined">chevron_right</i>
			</a>`
		displayInfo(`${wikiSearchResult}`)
		speechSpeak(`${argument.extract}`)
		//console.log(argument)
	})
}

function loginForm (arg) {
	arg.preventDefault()
	$.ajax({
		url: 'ajaxHandler.php',
		type: 'POST',
		dataType: 'json',
		data: { fData: $(arg.target).serialize(), fType: arg.target.id },
		success: function (argument) {
			userLogin = true
			console.log(argument)
			if (argument) {
				userPrompt = '<h2>User Prompt</h2>\
					<p>You are a logged in User. Choose your Profile</p>' + argument.profiles	
				$(arg.target)[0].reset()
				displayInfo(userPrompt)
			}
		},
		error: (argument) => {
			userLogin = false
			$(arg.target).append('<p>Not Verified</p>')
			console.log(argument.responseText)
		}
	})
}
//$('#speak-btn').click((event) => { speechSpeak(arg) })

// main function
function mainFunction() {

	$('#command-btns-id button').click(function (event) {
		$('#results-id').hide();
		if (event.target.matches('#speak-btn, #speak-btn i')) {
			displayInfo(userPrompt)
			speechSpeak(greetMsg)
		}
		else if (event.target.matches('#start-btn, #start-btn i')) {
			speechRecog(true);
		}
		else if (event.target.matches('#stop-btn, #stop-btn i')) {
			speechRecog(false);
		}
		else if (event.target.matches('#info-btn, #info-btn i')) {
			displayInfo(infoVar)
		}
		else {

		}
	})
}

$(document).ready(function () {
	$.ajax({
		type: 'POST',
		url: 'ajaxHandler.php',
		dataType: 'json',
		data: {fType: 'translate'},
		success: function(argument) {
			translateData = argument
			console.log(translateData)
		}
	})
	mainFunction()
})