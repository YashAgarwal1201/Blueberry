
// Some global declarations 
window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
const recognition = new window.SpeechRecognition();

const synthesis = window.speechSynthesis;

var result;
const greetMsg = 'Hello there, I am Blueberry. What is your name ?';
var userName = '', userPassword = null, hasForgot = null; //varibales to store user details
var infoVar, userPrompt;

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
	$.ajax({
		type: 'GET',
		url: 'ajaxHandler.php',
		dataType: 'json',
		data: {var1: 'help'},
		success: function(argument) {
			//
			infoVar = argument.a
			userPrompt = argument.b
		}
	})
	mainFunction()
})