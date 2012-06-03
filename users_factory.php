<?php
include("database.php");
include("connection_factory.php");
include("filters_city.php");
include("cities_factory.php");

class Users_Factory{
	 
   	var $users_from_twitter;
   	var $users_with_conflict;
   	var $instance_conn;
	var $city_factory;
	var $filter_city;
   	var $zones;
   	
   	function __construct() { 
		
      	 $this->users_new_from_twitter = array();
      	 $this->users_with_conflict = array();
      	 $this->instance_conn = Database::getInstance(); 
      	 $this->city_factory = new Cities_Factory();
      	 $this->filter_city = new Filters_City();
      	 $this->zones = array(array(30, array(-21.0, -69.4, 450)),
							  array(30, array(-28.7, -70.4, 250)),
							  array(30, array(-30.4, -70.9, 220)),
							  array(40, array(-33.0, -71.0, 100)),
							  array(50, array(-35.1, -71.2, 120)),
							  array(40, array(-37.0, -72.1, 170)),
							  array(40, array(-39.7, -72.4, 190)),
							  array(40, array(-42.5, -72.9, 260)),
							  array(20, array(-48.1, -73.9, 260)),
							  array(20, array(-52.9, -71.2, 340))
								);
      	 
   	} 
   	public function iterate_zones() {
		$connection = new Connection_Factory();
			
		foreach($this->zones as $zone) {
			$max_calls = $zone[0];
			$dat_zone = $zone[1];
			#$this->json = $connection->get_tweets_from_location("-35.5","-71.5","2300", "100");
			$json = $connection->get_tweets_from_location($dat_zone[0], $dat_zone[1], $dat_zone[2], $max_calls);
			if(isset($json->hash->error)) {
				exit(0);
			}
			
			$this->build_users_from_twitter($json);
			#exit(0);	
		}	
	
	}
	
	public function build_users_from_twitter($json) {
		
		if (isset($json->results)) {
			$nresults = count($json->results);
		}
		else {	
			return 0;	
		}
	
		$profile_image_url = "#";
		
		#for ($i = 0; $i < $nresults; ++$i) {
		foreach ($json->results as $user) {	
			//verificamos que no este guardado
			if (!$this->user_exists($user->from_user_id)) {
					
				if (isset($user->profile_image_url)) {
					$profile_image_url = $user->profile_image_url;
				}	
			
				$real_location = $this->real_location($user->from_user);
								
				#aplicamos el primer filtro
				if ($this->filter_city->is_prohibited_city($real_location)) {
					continue;
				}				
				//por si superamos la cuota de twitter aquí podemos guardar pendientes
				if (!isset($real_location)) {
						exit(0);
				}
				#echo "TUTO real location $real_location <br>";
				$city = $this->city_factory->get_city($real_location);
				#echo "TUTO $city <br>";
				if (strtoupper($city) == "CONFLICTO") {
					#echo "TUTO $real_location, $this->json->results[$i]->from_user <br>";
					array_push($this->users_with_conflict, array( 
						'from_user_id' => $user->from_user_id,
						'ciudad' => $real_location,
						'pais' => 'chile',
						'profile_image_url' => $profile_image_url,
						'from_user' => $user->from_user,
						'location' => $user->location)
						);
				}			
				else if ($city != 0 and strtoupper($city) != "CONFLICTO") {	
					//almacenamos en el arreglo con todos los datos
					array_push($this->users_new_from_twitter, array( 
						'from_user_id' => $user->from_user_id,
						'ciudad' => $city,
						'pais' => 'chile',
						'profile_image_url' => $profile_image_url,
						'from_user' => $user->from_user,
						'location' => $user->location)
						);
				}
				$profile_image_url = '#';
			}
		}	
	}

	private function real_location($user) {
		
		$connection = new connection_factory();
		$perfil = $connection->get_perfil_for_user($user);
		
		if (isset($perfil->error) && ereg ("^Rate limit exceeded", $perfil->error)) {
			return 0;
		}	
		#echo "Buscando en la ciudad".$perfil->location."<br />";
		return $perfil->location;
	}
		
	private function user_exists($str) {
		
		$query = "SELECT from_user_id from users where from_user_id = $str";
		$matrix = $this->instance_conn->get_connection()->query($query);
		$total_results = $matrix->num_rows;
		if ($total_results > 0) {
			return 1;
		}		
		return 0;	
	} 
	
	public function save_new_users() {

		echo "Se agregaron los siguientes usuarios <br />";
		print_r($this->users_new_from_twitter);


		foreach ($this->users_new_from_twitter as $user) {
			
			$from_user_id = $user['from_user_id'];
			$ciudad = $user['ciudad'];
			$pais = $user['pais'];
			$profile_image_url = $user['profile_image_url'];
			$from_user = $user['from_user'];
			$location = $user['location'];	
			$query = "INSERT INTO users (id, from_user_id, ciudad, pais, profile_image_url, from_user, location, fecha_ingreso) 
				VALUES('', '$from_user_id', '$ciudad', '$pais', '$profile_image_url', '$from_user', '$location', now())";
			
			if(!$this->instance_conn->get_connection()->query($query)) {
				echo "error $query";	
			}
		}

	}
	
	public function save_conflicted_users() {

		echo "Se agregaron los siguientes usuarios conflictivos <br />";
		print_r($this->users_with_conflict);
		

		foreach ($this->users_with_conflict as $user) {
				
			$from_user_id = $user['from_user_id'];
			$ciudad = $user['ciudad'];
			$pais = $user['pais'];
			$profile_image_url = $user['profile_image_url'];
			$from_user = $user['from_user'];
			$location = $user['location'];	
			$query = "INSERT INTO pendientes (id, from_user_id, ciudad, pais, profile_image_url, from_user, location, fecha_ingreso) 
				VALUES('', '$from_user_id', '$ciudad', '$pais', '$profile_image_url', '$from_user', '$location', now())";
					
			if(!$this->instance_conn->get_connection()->query($query)) {
				echo "error $query";	
			}
		}

	}	
} 

?>
