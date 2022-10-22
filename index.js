
// Some global declarations 
window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
const recognition = new window.SpeechRecognition();

const synthesis = window.speechSynthesis;

var result;
const greetMsg = 'Hello there, I am Blueberry. What is your name ?';

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
			$('#message-id').text('User: ' + result);
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
			$('#message-id').text('Bot: ' + arg);
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

function supportedVoice() {
	let voices = synthesis.getVoices();
	//console.log(speechSpeak(greetMsg))
	for (let i = 0; i < voices.length; i++) {
		console.log(voices[i])
	}
}

// function to act according to user's query
function queryResult(argument) {
	let queryResultVariable = argument
	if (queryResultVariable.includes('say hello')) {
		speechSpeak('hello there, I am Blueberry.')
	}
}

function displayInfo() {
	let infoString = '<h2>How-to-Use</h2>\
		<li>Press <i class="material-icons-outlined">campaign</i> button to start this Blueberry bot\
		<li>Press <i class="material-icons-outlined">mic</i> button to start speech recording\
		<li>Press <i class="material-icons-outlined">stop</i> button to stop recording speech'
	return infoString;
}

function mainFunction() {
	$('#command-btns-id button').click(function (event) {
		$('#results-id').hide();
		if (event.target.matches('#speak-btn, #speak-btn i')) {
			speechSpeak(greetMsg)
		}
		else if (event.target.matches('#info-btn, #info-btn i')) {
			$('#results-id').slideDown()
			$('#results-id section').html(displayInfo())
		}
		else {

		}
	})
	//speechRecog(true);
}
mainFunction()

/*$(document).ready(function () {
	main()
})*/