<?php
include('users_factory.php');

$users_fact = new Users_Factory();

$users_fact->iterate_zones();

$users_fact->save_new_users();

$users_fact->save_conflicted_users();

?>
