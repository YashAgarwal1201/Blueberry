<?php 

//session_start();

/*if ($_SESSION['userName'] == 'alpha') {
	// code...
	echo "current User";
}*/

?>

<!DOCTYPE html>
<html lang="en-US">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Blueberry (a speech recognition mini project)</title>
	<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
	<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined">
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.1/jquery.min.js"></script>
	<script src="//unpkg.com/brain.js"></script>
	<script src='http://okfnlabs.org/wikipediajs/wikipedia.js'></script>
	<link rel="stylesheet" type="text/css" href="index.css">
</head>

<body id="body-id">
	<h1 title="Speech Recognition mini project">Blueberry</h1>

	<div class="speech-class" id="speech-id">
		<section id="output-id"></section>
		<section class="message" id="message-id"></section>
		<section class="command-btns" id="command-btns-id">
			<button id="start-btn" onclick="" title="click to start speech recognition">
				<i class="material-icons-outlined">mic</i>
			</button>
			<button id="stop-btn" onclick="" title="click to stop speech recognition">
				<i class="material-icons-outlined">stop</i>
			</button>
			<button id='speak-btn'><i class="material-icons-outlined">campaign</i></button>
			<button id='info-btn' title="click to view 'how to use' info"><i class="material-icons-outlined">info</i></button>
		</section>
	</div>
	<div class="results" id="results-id">
		<button onclick="$('#results-id').hide()"><i class="material-icons-outlined">close</i></button>
		<section class="user-form" id="user-form-id"></section>
	</div>
	<?php
//print_r($_SESSION);
?>
	<!--div>
		<button onclick="let arg = prompt('Enter a value'); console.log(isPalindrome(arg));">isPalindrome</button>
		<button onclick="let arg2 = prompt('Enter a value'); console.log(isEven(parseInt(arg2)));">isEven</button>
		<button onclick="console.log(arrayReverse([1, 2, 3, 4, 5, 5, 2, 3, 1, 7]));">arrayReverse</button>
		<button onclick="console.log(arraySort(['apple', 'buffalo', 'banana', 'amino']));">arraySort</button>
		<button onclick="console.log(countInstance(10000, 0));">countInstance</button>
		<button onclick="console.log(isPrime(541));">isPrime</button>
		<button onclick="console.log(primeNumbers(1,100));">PrimeNumbers</button>
		<button onclick="console.log(countDigits(1233463));">countDigits</button>
		<button onclick="console.log(typeof(typeof(10)))">lick</button>
	</div-->
</body>
<!--script src="https://cdn.jsdelivr.net/npm/daq-proc/dist/daq-proc.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.i18n/1.0.7/jquery.i18n.min.js" integrity="sha512-a0tGMh5o0nCoRDiMVaSmiWgB9s/JqfC+PQZHWANTzIhasvm5eH9NkWTmJ4WloaQWLT8fEzRBjvADgFNDf0WusQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script-->
<script src="textProcessing.js"></script>
<script src="index.js"></script>
<!--script src="userDefinedFunctions.js"></script-->
</html>
