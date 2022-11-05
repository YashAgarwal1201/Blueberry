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
			$profiles = 
			'<section class="profiles section-rw">
				<content class="profile" id="profile1-id"><button><i class="material-icons-outlined">account_circle</i><br/>' . $pr1['name'] . '</button></content>
				<content class="profile" id="profile2-id"><button><i class="material-icons-outlined">account_circle</i><br/>' . $pr2['name'] . '</button></content>
				<content class="profile" id="profile3-id"><button><i class="material-icons-outlined">account_circle</i></button></content>
				<content class="profile" id="profile4-id"><button><i class="material-icons-outlined">account_circle</i></button></content>
			</section>';
			echo json_encode(array('profile1' => $pr1, 'profile2' => $pr2, 'profiles' => $profiles));
		}
	}
}



?>