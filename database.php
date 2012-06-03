<?php
class Config 
{ 
    const host = "localhost"; 
    const user = ""; 
    const pass = ""; 
    const db_name = ""; 
} 

class Database extends Config {
    static private $instance = NULL;
    private $objMySqli;
    private function __construct() {
        $this->objMySqli=new mysqli(parent::host,parent::user,parent::pass,parent::db_name);
    }
    static public function getInstance() {
       if (self::$instance == NULL) self::$instance = new self;
       return self::$instance;
    }
    public function __clone()
    {
        trigger_error('Clone is not allowed.', E_USER_ERROR);
    }
    public function get_connection(){
        return $this->objMySqli;
    }
}

?>
