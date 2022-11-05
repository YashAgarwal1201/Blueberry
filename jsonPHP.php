<?php 

$jsonFileName = 'userData2.json';
$jsonFileData = stripslashes(html_entity_decode(file_get_contents($jsonFileName))); // get the json file content
$jsonData = json_decode($jsonFileData, true); // decode the string format json file data in associative array format
//print_r($jsonData);

function check_user_identity($u_name, $u_password) {
	GLOBAL $jsonData;
	if (strtolower(gettype($jsonData)) == 'array') {
		if (in_array($u_name, array_keys($jsonData['allUsersDetails']))) {
			foreach ($jsonData['allUsersDetails'] as $key => $value) {
				foreach ($value as $key2 => $value2) {
					if ($u_password == $value2) {
						$i_result = true; // index 0
						$mainProfile = $jsonData['allUsersDetails'][$key]; // index 1
						return array($i_result, $mainProfile);
						//return array('i_result' => true, 'mainProfile' => $jsonData['allUsersDetails'][$key]);
					}
					else
						return false;
				}
			}
		}
		else {
			return false;
		}
	}
	else {
		return false;
	}
}

//check_user_identity('@main_user12','@main_user12');
/*
//echo $jsonFileData;

$jsonFileName = 'userData2.json';
$jsonFileData = file_get_contents($jsonFileName); // get the json file content
$jsonData = json_decode($jsonFileData, true); // decode the string format json file data in associative array format

if (strtolower(gettype($jsonData)) == "array" ) {
	passwordVerify($user_name, $input_password, $has_forgot);
}
$jsonData = json_decode($jsonFileData, true); // decode the string format json file data in associative array format

// if datatype of $jsonData is array then only do anything ahead
if (strtolower(gettype($jsonData)) == "array" ) {
	print_r($jsonData);
	$jsonData['allUsersDetails']["user2"] = array("name"=>"V", "isPrimary"=> False);
	print_r($jsonData);
	$jsonData2 = json_encode($jsonData);

	$fp = fopen($jsonFileName, "w+");
	fwrite($fp, $jsonData2);
	fclose($fp);
}*/

?>