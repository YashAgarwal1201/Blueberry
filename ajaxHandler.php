<?php	
require 'passwordVerify.php';
require 'jsonPHP.php';

$params = array();
parse_str($_POST['fData'], $params);
$user_name = $params['Name'];
$user_password = $params['Password'];;

$user_name = check_user_name($user_name);
$user_password = check_user_password($user_password);

if (!empty($user_name) and isset($user_name) and $user_name != 'wrong username') {
	if(!empty($user_password) and isset($user_password) and $user_password != 'wrong password') {
		
		$identity_result = check_user_identity($user_name, $user_password);
		if ($identity_result[0]) {
			$pr1 = $identity_result[1]['primaryUser'];
			$pr2 = $identity_result[1]['user2'];
			echo json_encode(array('profile1' => $pr1, 'profile2' => $pr2));
		}
		else {
			echo json_encode('not verified');
		}
	}
	else {
		echo 403;//json_encode("Sorry But an Error has occured please try again");
	}
}
else {
	echo 403;//json_encode("Sorry But an Error has occured please try again");
}



?>