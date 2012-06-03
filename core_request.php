<?php
	include('database.php');	

	$instance_conn = Database::getInstance();
	$opcion = $_POST['opcion'];
	$lugar = $_POST['lugar'];

	if ($opcion == 'total')	{
		echo lista_total($instance_conn, $lugar);	 
	}
	else if($opcion == 'detail_place') {
		echo detail_place($instance_conn, $lugar);		
	}
	
	mysqli_close($instance_conn->get_connection());

function ingresar_nuevo($conn, $lugar)
	{
	$user = $lugar;

	$patron = "/@/";
	if (preg_match($patron, $user))
		{
		$user = substr($user,1);
		}
	
	$query = "SELECT from_user FROM users where from_user = '$user'";

        $matriz = mysql_query($query, $conn) or die(mysql_error());
        $total_resultados = mysql_num_rows($matriz);
        if ($total_resultados > 0)
        	{
		return json_encode(array('data'=>array('res'=>'ya estaba en db')));	
        	}

	$query = "SELECT name FROM pendientes where name = '$user'";

        $matriz = mysql_query($query, $conn) or die(mysql_error());
        $total_resultados = mysql_num_rows($matriz);
        if ($total_resultados > 0)
        	{
		return json_encode(array('data'=>array('res'=>'ya estaba')));	
        	}

	$query = "INSERT INTO pendientes(name, id) VALUES('$user', '')";

        if (mysql_query($query, $conn) or die(mysql_error()))
		{
		return json_encode(array('data'=>array('res'=>'ok')));	
		}
	return json_encode(array('data'=>array('res'=>'problema db')));	

	}

function lista_total($instance_conn, $lugar)
	{
	
	$extra_param = "";
	if ($lugar != 'region')
		{
		$extra_param .= "AND ciudades.slug = '$lugar'";
		}
	$query = "SELECT count(users.from_user_id) as total, ciudades.name, ciudades.lat, ciudades.lon, ciudades.slug as slug from users, ciudades where users.ciudad = ciudades.id group by ciudades.id order by ciudades.name asc";
	$matriz = $instance_conn->get_connection()->query($query);
	$total_resultados = $matriz->num_rows;
	$total_cities = array();
	if ($total_resultados > 0)
		{
		while ($col = $matriz->fetch_assoc()) 
			{			
			array_push($total_cities, array('total'=>$col['total'], 'name'=> htmlentities(($col['name'])), 'lat'=>$col['lat'], 'lon'=>$col['lon'], 'slug' => $col['slug']));
			}       
		}
	
	return json_encode(array('data'=>array('total_cities'=>$total_cities)));	

	}			

function detail_place($instance_conn, $lugar) {
	
	$query = "SELECT users.from_user as name_user, ciudades.name as city_name from users, ciudades where users.ciudad = ciudades.id and ciudades.slug = '$lugar' order by users.from_user asc";
	$matriz = $instance_conn->get_connection()->query($query);
	$total_resultados = $matriz->num_rows;
	$total_twitters = array();
	$city_name;
	if ($total_resultados > 0) {
		while ($col = $matriz->fetch_assoc()) {	
			$city_name = htmlentities($col['city_name']);			
			array_push($total_twitters, array('name'=>htmlentities($col['name_user'])));
		}       
	}
 	return json_encode(array('data'=>array('city_name' => $city_name, 'users'=>$total_twitters)));	

}
	
?>
