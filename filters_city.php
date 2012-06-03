<?php

class Filters_City{
	 
	var $list_filters;
	
   	function __construct() { 
		$this->list_filters = array("ka_ca", "gua_hua", "ke_que", "k_ca");

   	} 
   	
   	public function apply_all_filters($str) {

		foreach($this->list_filters as $filter) {
			$str = $this->$filter($str);
		}
		return $str;		
	}
   	
	public function get_list_filters() {
			
		return $this->list_filters;
	}
	
	public function ka_ca($str) {
		return ereg_replace('ka', 'ca', $str);
	}
	
	public function gua_hua($str) {
		return ereg_replace('gua', 'hua', $str);
	}
	
	public function ke_que($str) {
		return ereg_replace('ke', 'que', $str);
	}
	
	public function k_ca($str) {
		return ereg_replace('k', 'ca', $str);
	}
	
	public function is_prohibited_city($str) {
	
		$prohibited_cityes = array('BOLIVIA', 'DOMINICANA', 'CALI',
								   'BUENOSAIRES', 'SANTAMARIARS',
								   'RIOGRANDE', 'BRASIL'
									);
			
	   $str = $this->clean_string_for_comparate($str);
	   
	   foreach ($prohibited_cityes as $prohibited_city) {
			if (ereg($prohibited_city,$str)) {
				return true;
			}		
		}
		
		return false;
	}
	
	public function clean_string_for_comparate($str) {
		utf8_encode($str);
		$a = array("á","é","í","ó","ú","à","è","ì","ò","ù","ä","ë","ï","ö","ü","â","ê","î","ô","û","ñ","ç", "-", ".", " ");
		$b = array("a","e","i","o","u","a","e","i","o","u","a","e","i","o","u","a","e","i","o","u","n","c", " ", " ", "");
		$str = str_replace($a, $b, $str);
		$str = strtoupper($str);
	
		return $str;
	}
} 

?>
