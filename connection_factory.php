<?php
include('twitteroauth/twitteroauth.php');
include('config.php');
class Connection_Factory{
	 
   	var $connection;
   
   	function __construct() { 
      	 $this->connection = new TwitterOAuth(CONSUMER_KEY, CONSUMER_SECRET, "7595582-AX9ZQclqxFGeAo7XHkl7LkqzXlSpA4cGr4PU5N5EjY", "u4k3fGtskJGJqukSVATGacBp0HA7JzvSvuRuPltWG4");
      	  
   	} 
	public function get_tweets_from_location($lat, $lon, $kms, $rpp) {
		$this->connection->host = "https://search.twitter.com/";
		$tweets = $this->connection->get("search", array("geocode" => "$lat,$lon,$kms"."km", "rpp" => "$rpp"));
		return $tweets;
	}
	
	public function get_perfil_for_user($user) {

		$this->connection->host = "http://api.twitter.com/1/";
		$perfil = $this->connection->get("users/show", array("screen_name" => "$user"));
		return $perfil;
	}
	
} 

?>
