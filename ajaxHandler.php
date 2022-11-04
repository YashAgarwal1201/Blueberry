<?php	
require 'passwordVerify.php';
require 'jsonPHP.php';
//$var1 = $_GET['var1'];

$params = array();
parse_str($_POST['fData'], $params);
$user_name = $params['Name'];
$user_password = $params['Password'];;

$user_name = check_user_name($user_name);
$user_password = check_user_password($user_password);

if (!empty($user_name) and isset($user_name) and $user_name != 'wrong username') {
	if(!empty($user_password) and isset($user_password) and $user_password != 'wrong password') {
		
		$identity_result = check_user_identity($user_name, $user_password);
		if ($identity_result) {
			echo "verified";
		}
		else {
			echo "not verified";
		}
	}
	else {
		echo "Sorry But an Error has occured please try again";
	}
}
else {
	echo "Sorry But an Error has occured please try again";
}
/*
if (!empty($var1) and isset($var1) and $var1 == 'help' and preg_match("/^[0-9a-zA-Z-' ]*$/",$var1)) {
	// code...
	$info_var = '';

	$user_prompt = '';

	echo json_encode(array('a' => $info_var, 'b' => $user_prompt));	
}*/



?>