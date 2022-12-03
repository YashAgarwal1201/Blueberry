<?php	
require 'passwordVerify.php';
require 'jsonPHP.php';
include '../../vendor/autoload.php';
use \Statickidz\GoogleTranslate;

if ($_POST['fType'] == 'login-form-id') {

	$params = array();
	parse_str($_POST['fData'], $params);
	$user_name = $params['Name'];
	$user_password = $params['Password'];

	$user_name = check_user_name($user_name);
	$user_password = check_user_password($user_password);

	if (!empty($user_name) and isset($user_name) and $user_name != 'wrong username') {
		if(!empty($user_password) and isset($user_password) and $user_password != 'wrong password') {
			userDetails($user_name, $user_password);
		}
	}
}
else if ($_POST['fType'] == 'register-form-id') {

	$params = array();
	parse_str($_POST['fData'], $params);
	$user_name = $params['Name'];
	$user_password = $params['Password'];

	$user_dob = $params['Dob'];
	$user_email = $params['Email'];
	$user_main_name = $params['Name2'];

	$user_name = check_user_name($user_name);
	$user_password = check_user_password($user_password);

	if (!empty($user_name) and isset($user_name) and $user_name != 'wrong username') {
		if(!empty($user_password) and isset($user_password) and $user_password != 'wrong password') {
			$addUser = add_new_user($user_name, $user_password, $user_dob, $user_email, $user_main_name);
			if($addUser) {
				userDetails($user_name, $user_password);
			}
		}
	}
}
else if ($_POST['fType'] == 'translate') {
	// code...
	$directory_path = './Translate Folder/'; // directory to be created along with path
	//$file_name = $directory_path . 'translations-file.json'; // file to be created along with path
	
	if (!is_dir($directory_path)) {
		mkdir($directory_path); // make a directory
	}
	else {

		$source = 'auto';
		$target = 'en';
		$text = $_POST['fData'];//'kaise ho';
		$trans = new GoogleTranslate();
		$result = $trans->translate($source, $target, $text);

		$file_name = $directory_path . $source . 'translations-file.txt';
		$file_pointer = fopen($file_name, 'r+') or die('unable to open file'); // create and open the file
		
		while (!feof($file_pointer)) {
			
			$val = fgets($file_pointer);
			$val = explode(" : ", $val);
			if ($val[0] != $text) {
				$result = $text . ' : ' . $result . PHP_EOL;
				fwrite($file_pointer, $result);
			}
		}
		fclose($file_pointer); // close the file
		echo $result;//json_encode(array('a' => $result));
	}
}
else if ($_POST['fType'] == 'datatranslate') {
	
	$directory_path = './Translate Folder/';
	if (is_dir($directory_path)) {
		
		$data = '';
		$files = scandir($directory_path, 0);
		for ($i = 2; $i < count($files); $i++) { 
			$file_n = $directory_path . $files[$i];
			$fp = fopen($file_n, 'r');
			while(!feof($fp)) {
				$data .= fgets($fp) . PHP_EOL;
			}
		}
		echo(json_encode($data));
	}
}
else {

}

// function to return user details
function userDetails($user_name, $user_password)
{
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

?>