<?php
#include("database.php");
#include("filters_city.php");
class Cities_Factory{
	
   	var $instance_conn;
	var $filter_city;
   	function __construct() { 
      	 $this->instance_conn = Database::getInstance(); 
      	 $this->filter_city = new Filters_City();

   	} 

	private function get_cities_from_db ($str) {
		$str = $this->clean_string(trim($str));
		$query = "SELECT id from ciudades where slug = '$str'";
		$matrix = $this->instance_conn->get_connection()->query($query);
		$total_results = $matrix->num_rows;
		if ($total_results == 1) {
			$col = $matrix->fetch_assoc();
			return $col['id'];
		}
		else if ($total_results > 1) {
			return "CONFLICTO";
			}		
	}

	public function get_city($str) {
		
		$result = $this->get_cities_from_db($str);
		
		if ($result == "CONFLICTO") {
			return "CONFLICTO";
		}
		else if ($result <= 0) {
			
			return $this->_force_search($str);
		}
		else if ($result > 0){
			return $result;	
		}
		return 0;
	}

	private function _force_search($str) {
		
		#trozamos el string, esto nos debería devolver la mejor opción de trozado
		$array_posibilities = $this->_tokenizer_city($str);
		
		$possible_city = '';
		#suponemos que la primera posicion del arreglo es la ciudad
		if (count($array_posibilities) > 0) {
			$possible_city = $array_posibilities[0];
			$id_result = $this->get_cities_from_db($possible_city);
			
			if ($id_result == "CONFLICTO") {
				return "CONFLICTO";
			}
			else if($id_result <= 0) {
				#buscamos aplicando los filtros
				$filters = $this->filter_city->get_list_filters();
				foreach ($filters as $filter) {
					$city_filtered = $this->filter_city->$filter($possible_city);
					$id_city_result = $this->get_cities_from_db($city_filtered);
					if ($id_city_result == "CONFLICTO") {
						return "CONFLICTO";		
					}
					else if ($id_city_result > 0) {
						return $id_city_result;
						break;
					}
				}
				
				#por ultimo si no tenemos hasta este punto
				#una respuesta satisfactoria tratamos de aplicar todos los filtros
				#sobre el string
				#ultimo recurso
				$city_filtered = $this->filter_city->apply_all_filters($possible_city);
				$id_city_result = $this->get_cities_from_db($city_filtered);
				if ($id_city_result == "CONFLICTO") {
					return "CONFLICTO";		
				}
				else if ($id_city_result > 0) {
					return $id_city_result;
				}
				
				#no pudimos encontrar la ciudad, nos dimos por vencidos :(
				return 0;
				
			}	
			else if ($id_result > 1) {
				return $id_result;
			}		
		}
		else {
			return 0;	
		}		
	}
	
	public function _tokenizer_city($str) {
		
		$separators = Array("-", "/", ",");
		$max_sep = 0;
		$sep_max = '';
		foreach ($separators as $separator) {
			
			$num_tokens = count(split($separator, $str));
	
			if($num_tokens >= $max_sep) {
				$sep_max = $separator;
				$max_sep = $num_tokens;
			}
		}
		return split($sep_max, $str);
	}
	
	private function clean_string($str) {
		utf8_encode($str);
		$a = array("á","é","í","ó","ú","à","è","ì","ò","ù","ä","ë","ï","ö","ü","â","ê","î","ô","û","ñ","ç", " ", ".");
		$b = array("a","e","i","o","u","a","e","i","o","u","a","e","i","o","u","a","e","i","o","u","n","c", "-", "-");
		$str = str_replace($a, $b, $str);
		$str = strtolower($str);
	
		return $str;
	}
} 

?>
