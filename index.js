
// Some global declarations 
window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
const recognition = new window.SpeechRecognition();

const synthesis = window.speechSynthesis;

var result;

// Speech Recognition Function 
function speechRecog (arg) {
	if($('#start-btn i').text() == 'mic') {
		$('#start-btn i').text('mic_off')
	}
	else {
		$('#start-btn i').text('mic_off')	
	}
	if ('SpeechRecognition' in window) {
		$('#output-id').text('supported speech');
		
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
		$('#output-id').text('not supported');
}

// Speech Speak Function 
function speechSpeak (arg) {
	if ('speechSynthesis' in window) {
		$('#output-id').text('speech synthesis is supported');
		
		let utterance = new SpeechSynthesisUtterance(arg);
		utterance.lang = 'en-IN';

		if (arg) {
			speechSynthesis.speak(utterance);
			let voices = synthesis.getVoices();
			$('#message-id').text('Bot: ' + arg);
			/*for (let i = 0; i <voices.length; i++) 
				console.log(voices[i]);*/
		}
	}
	else
		$('#output-id').text('speech synthesis not supported');
}

// function to process user's input query
function queryProcess(arg) {
	if (arg.includes('say hello')) {
		speechSpeak('hello there, I am Blueberry.')
	}
}
