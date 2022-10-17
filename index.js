
// Some global declarations 
window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
const recognition = new window.SpeechRecognition();

const synthesis = window.speechSynthesis;

var result;

// Speech Recognition Function 
function speechRecog (arg) {
	if ('SpeechRecognition' in window) {
		$('#output-id').text('supported speech');
		
		recognition.continuous = arg;
		console.log(recognition.continuous);
		
		recognition.onresult = (event) => {
			result = result + event.results[event.results.length -1][0].transcript;
			$('#message-id').text('User: ' + result);
		}
		
		if (arg) {
			recognition.start();
		}
		else
			recognition.stop();
	}
	else
		$('#output-id').text('not supported');
}

// Speech Speak Function 
function speechSpeak (arg) {
	if ('speechSynthesis' in window) {
		$('#output-id').text('speech synthesis is supported');
		
		let utterance = new SpeechSynthesisUtterance(result);
		utterance.lang = 'en-US';
		//speechSynthesis.speak(utterance);
		
		if (arg) {
			speechSynthesis.speak(utterance);
			let voices = synthesis.getVoices();
			$('#message-id').text('Bot: ' + utterance);
			for (let i = 0; i <voices.length; i++) 
				console.log(voices[i]);
		}
	}
	else
		$('#output-id').text('speech synthesis not supported');
}

/*function main() {
	$('#command-btn button').click(function (event) {
		if (event.target.matches('#start-btn'))
			speechRecog(true);
		else if (event.target.matches('#stop-btn'))
			speechRecog(false);
		else
			speechSpeak(true);
	})
}

$(document).ready(function () {
	main();
}) */