<?php 

$jsonFileName = 'userData.json';
$jsonFileData = file_get_contents($jsonFileName); // get the json file content
//echo $jsonFileData;

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
}
?>