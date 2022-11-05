
// Some global declarations 
window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
const recognition = new window.SpeechRecognition();

const synthesis = window.speechSynthesis;

var result;
const greetMsg = 'Hello there, I am Blueberry. What is your name ?';
var userName = '', userPassword = null, hasForgot = null; //varibales to store user details
var infoVar = '<h2>How-to-Use</h2>\
		<li>Press <i class="material-icons-outlined">campaign</i> button to start this Blueberry bot\
		<li>Press <i class="material-icons-outlined">mic</i> button to start speech recording\
		<li>Press <i class="material-icons-outlined">stop</i> button to stop recording speech\
		<li>For now only English language is supported',
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
		</form>'

// Speech Recognition Function 
function speechRecog (arg) {
	if ('SpeechRecognition' in window) {
		
		recognition.continuous = arg;
		console.log(recognition.continuous);
		
		recognition.onresult = (event) => {
			result = result + event.results[event.results.length -1][0].transcript;
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
			queryProcess(result);
		}
	}
	else
		$('#output-id').text('speech not supported by your browser');
}

// Speech Speak Function 
function speechSpeak (arg) {
	if ('speechSynthesis' in window) {
		
		let utterance = new SpeechSynthesisUtterance(arg);
		utterance.lang = 'en-US';
		console.log(utterance)

		if (arg) {
			//speechSynthesis.speak(utterance);
			synthesis.speak(utterance);
			$('#message-id').append('Bot: ' + arg + '<br>');
		}
	}
	else
		$('#output-id').text('speech synthesis not supported');
}

// function to process user's input query
function queryProcess(arg) {
	let queryProcessVariable = arg
	if (queryProcessVariable.includes('say hello')) {
		speechSpeak('hello there, I am Blueberry.')
	}
	queryResult(queryProcessVariable)
}

// function to act according to user's query
function queryResult(argument) {
	let queryResultVariable = argument
	if (queryResultVariable.includes('say hello')) {
		speechSpeak('hello there, I am Blueberry.')
	}
	else if (queryResultVariable.includes('search')) {
		window.open('http://google.com/search?q=' + queryResultVariable);
	}
	else {

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

function loginForm (arg) {
	arg.preventDefault()
	//console.log($(arg.target).serialize())
	$.ajax({
		url: 'ajaxHandler.php',
		type: 'POST',
		dataType: 'json',
		data: { fData: $(arg.target).serialize() },
		success: function (argument) {
			//console.log(argument)
			if (argument) {
				userPrompt = '<h2>User Prompt</h2>\
					<p>You are a logged in User</p>'
				$(arg.target)[0].reset()
				displayInfo(userPrompt)
			}
			else {
				$(arg.target).append('<p>Not Verified</p>')
			}
		}
	})
}

// main function
function mainFunction() {

	$('#command-btns-id button').click(function (event) {
		$('#results-id').hide();
		if (event.target.matches('#speak-btn, #speak-btn i')) {
			//speechSpeak(greetMsg)
			displayInfo(userPrompt)
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
	/*$.ajax({
		type: 'GET',
		url: 'ajaxHandler.php',
		dataType: 'json',
		data: {var1: 'help'},
		success: function(argument) {
			//
			//infoVar = argument.a
			//userPrompt = argument.b
		}
	})*/
	mainFunction()
})