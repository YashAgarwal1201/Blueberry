<?php 

require 'passwordVerify.php';

//echo $jsonFileData;

$user_name = $_POST['userName'];
$input_password = $_POST['inpPassword'];
$has_forgot = $_POST['hasForgot'];

$jsonFileName = 'userData2.json';
$jsonFileData = file_get_contents($jsonFileName); // get the json file content
$jsonData = json_decode($jsonFileData, true); // decode the string format json file data in associative array format

if (strtolower(gettype($jsonData)) == "array" ) {
	passwordVerify($user_name, $input_password, $has_forgot);
}
/*$jsonData = json_decode($jsonFileData, true); // decode the string format json file data in associative array format

// if datatype of $jsonData is array then only do anything ahead
if (strtolower(gettype($jsonData)) == "array" ) {
	print_r($jsonData);
	$jsonData['allUsersDetails']["user2"] = array("name"=>"V", "isPrimary"=> False);
	print_r($jsonData);
	$jsonData2 = json_encode($jsonData);

	$fp = fopen($jsonFileName, "w+");
	fwrite($fp, $jsonData2);
	fclose($fp);
}

class UserData {
	//properties
	private $userType;
	//methods
}*/
?>