<?php 

function check_user_name($u_name) {
	$u_name = trim($u_name);
	if (str_starts_with($u_name, '@main_') and strlen($u_name) > 7) {
		return $u_name;
	}
	else {
		return 'wrong username';
	}
}

function check_user_password($u_pass) {
	$u_pass = trim($u_pass);
	if (strlen($u_pass) > 7) {
		return $u_pass;
	}
	else {
		return 'wrong password';
	}
}

function passwordVerify($userName, $password, $has_forgot) {
	echo $userName;
}



?>