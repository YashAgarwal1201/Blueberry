<?php 

$jsonFileName = 'userData2.json';
$jsonFileData = file_get_contents($jsonFileName); // get the json file content
$jsonData = json_decode($jsonFileData, true); // decode the string format json file data in associative array format
print_r($jsonData);

function check_user_identity($u_name, $u_password) {
	GLOBAL $jsonData;
	if (strtolower(gettype($jsonData)) == 'array') {
		if (in_array($u_name, $jsonData['allUsersDetails'])) {
			for ($i = 0; $i < count($jsonData['allUsersDetails']); $i++) { 
				if ($u_password == $jsonData['allUsersDetails'][$i]['masterPassword']) {
					echo "true";
					//return true;
				}
				else {
					echo "false 2";
					//return false;
				}
			}
			// code...
		}
		else {
			echo "false 1";
			//return false;
		}
		//return true;
	}
	else {
		echo "false 3";
	}
}

check_user_identity('@main_user12','@main_user12');
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