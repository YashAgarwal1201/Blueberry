<?php	

$var1 = $_GET['var1'];

if (!empty($var1) and isset($var1) and $var1 == 'help' and preg_match("/^[0-9a-zA-Z-' ]*$/",$var1)) {
	// code...
	$info_var = '<h2>How-to-Use</h2>
		<li>Press <i class="material-icons-outlined">campaign</i> button to start this Blueberry bot
		<li>Press <i class="material-icons-outlined">mic</i> button to start speech recording
		<li>Press <i class="material-icons-outlined">stop</i> button to stop recording speech';

	$user_prompt = '<h2>User Prompt</h2>
		<iframe src="forms/Login 3.html" ></iframe>';

	echo json_encode(array('a' => $info_var, 'b' => $user_prompt));	
}



?>