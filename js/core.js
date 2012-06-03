var data = null;
var isInit = 0;
var cluster, overlay, map, periodical;
var time_update = 5000;
var menu_deploy = 0;
var update_list_deploy = 0;
var load_tw;
var timer_update_twitter;
var infos = new Array();

function init() {
	
	var latlng = new google.maps.LatLng(0, 0);
				var myOptions = {
					zoom: 0,
					center: latlng,
//					disableDefaultUI: true,
//					draggable: false,
//					scrollwheel: false,
					mapTypeId: google.maps.MapTypeId.ROADMAP
				}

	map = new google.maps.Map($("map"), myOptions);
	google.maps.event.addListenerOnce(map, 'idle', get_data);
	cluster=new ClusterMarker(map, {clusterMarkerTitle:'Click to see info about %count locations' , clusterMarkerClick:myClusterClick });
}

load_tw =	function load_twetts() {
					var dis = distance();
					var center = map.getCenter();
					var url_twett = "https://search.twitter.com/search.json?geocode="+center.lat()+","+center.lng()+","+dis+"km&rpp=20";
					new JsonP(url_twett,{
					  onComplete: function(data) {
					   twett_engine(data);
					  }.bind(this)
					}).request();
					
					return this;
				}

function distance() {
	var bounds = map.getBounds();

	var center = bounds.getCenter();
	var ne = bounds.getNorthEast();

	// r = radius of the earth in statute miles
	var r = 3963.0;  

	// Convert lat or lng from decimal degrees into radians (divide by 57.2958)
	var lat1 = center.lat() / 57.2958; 
	var lon1 = center.lng() / 57.2958;
	var lat2 = ne.lat() / 57.2958;
	var lon2 = ne.lng() / 57.2958;

	// distance = circle radius from center to Northeast corner of bounds
	var dis = r * Math.acos(Math.sin(lat1) * Math.sin(lat2) + 
	  Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1));	
	
	return dis;

}

function twett_engine(twetts){

	var html = '';
	if (!twetts.error) {
		if (twetts) {
			var l = twetts.results.length;
			for(var i = 0; i < l; ++i) {
				var tw = twetts.results[i];
				var nick = tw.from_user;
				var location = tw.location;
				var text = tw.text;
				html += '<div class = "tweet">';
				html +=	'	<div class = "nick">'+nick+'</div><div class = "location">'+location+'</div>';
				html += '	<div class = "text">'+text+'</div>';
				html += '</div>';
			}
		}
	}else {
		html = 'buscando....acercate mas al lugar'	
	}
	
	var txt = $('sidebar').innerHTML;
	
	if (txt != '') {
		html = html + txt;
	}
	
	$('sidebar').set('html', html);
}

function get_data() {
		var req = new Request({
				url:'core_request.php',
				method:'post',
				onSuccess: function(responseText, responseXML){
							//alert(responseText);
							data  = JSON.decode(responseText).data;		
							createMarkers(data);
							//load_tw.periodical(time_update);	
				
						}		 
			});
			
	req.send('opcion=total&lugar=""');
}
function load_users() {

	get_data();

}

function createMarkers(data) {
	var array_twitters = [];
	var total_cities = data.total_cities.length;

	for (var i = 0; i < total_cities; i++) {
		var iconImage = createICon(data.total_cities[i].total);
		var latlng = new google.maps.LatLng(data.total_cities[i].lat, data.total_cities[i].lon);
		var marker_map = new google.maps.Marker({
			visible: false,
			position: latlng, 
			icon: iconImage,
			title:data.total_cities[i].name+" - "+data.total_cities[i].total,
			map:map,
			html:data.total_cities[i].slug,
		});
		var info = new google.maps.InfoWindow({
			content:"<div id = 'detail_place'><img src = 'images/ajax-loader.gif'/></div>",
			});
		google.maps.event.addListener(marker_map, 'click', function() {	
			close_infos();
			infos[0] = info;		
			info.open(map, this);
			get_details_place(this.html, info);
			
		});
		array_twitters.push(marker_map);
	}
	cluster.addMarkers(array_twitters);
	cluster.fitMapToMarkers();
}

function get_details_place(slug, info) {
	infos[0]=info;
	info.setContent("<div id = 'detail_place'><img src = 'images/ajax-loader.gif'/></div>");
	var req = new Request({
			url:'core_request.php',
			method:'post',
			onSuccess: function(responseText, responseXML){	
						data  = JSON.decode(responseText).data;	
						info.setContent(loadTwitters(data));								
					}		 
		});
			
	req.send('opcion=detail_place&lugar='+slug);
}

function loadTwitters(data) {
	var l = data.users.length;
	var str = "<div  id = 'detail_user_place' ><h3>"+data.city_name+" - "+l+" twitters</h3>";
	for (var i = 0; i < l; ++i ) {
		str += '<a href = "http://www.twitter.com/'+data.users[i].name+'"  target = "_blank">'+data.users[i].name+'</a>';
	}
	return '</div>'+str;
}

function get_details_user(user) {

	var url_twett = "http://api.twitter.com/1/users/show/"+user+".json";
					new JsonP(url_twett,{
					  onComplete: function(data) {
					   info_user_engine(data);
					  }.bind(this)
					}).request();	
	
}
function get_info_klout(user) {
	var url_klout;
	Array.each(['score', 'topics', 'influenced_by', 'influencer_of'], function(type, index){
		if (type == 'score') {
			url_klout = "http://api.klout.com/1/klout.json?users="+user+"&key=nzvph4ndbx2vthrvvzxwfhp2";
		}
		if (type == 'topics') {
			url_klout = "http://api.klout.com/1/users/topics.json?users="+user+"&key=nzvph4ndbx2vthrvvzxwfhp2";
		}
		if (type == 'influenced_by') {
			url_klout = "http://api.klout.com/1/soi/influenced_by.json?users="+user+"&key=nzvph4ndbx2vthrvvzxwfhp2";
		}
		if (type == 'influencer_of') {
			url_klout = "http://api.klout.com/1/soi/influencer_of.json?users="+user+"&key=nzvph4ndbx2vthrvvzxwfhp2";
		}
		new JsonP(url_klout,{
		  onComplete: function(data) {
		   info_klout_engine(data, type);
		  }.bind(this)
		}).request();		
	});
}

function info_klout_engine(data, type) {

	var html = '';

	if (type == "score") {
		html += 'El score Klout es :'+data.users[0].kscore;	
		$('score_klout').set('html', html);
	}
	if (type == 'topics') {
		html += 'Sus topicos preferidos son :';
		if (data.users[0].topics != undefined) {
			data.users[0].topics.each(function(topics, index){ 
					html += '<p>'+topics+'</p>';
			});
		}	
		$('topics_klout').set('html', html);
	}
	if (type == 'influenced_by') {
		html += 'Esta influenciado por :';	
		if (data.users[0].influencers != undefined) {
			data.users[0].influencers.each(function(influencer, index){
				html += '<p>'+influencer.twitter_screen_name+' - con score : '+influencer.kscore+'</p>';
			});
		}	
		$('influenced_by_klout').set('html', html);
	}
	if (type == 'influencer_of') {
		html += 'Esta influenciando a :';
		if (data.users[0].influencees != undefined) {
			data.users[0].influencees.each(function(influencee, index){
				html += '<p>'+influencee.twitter_screen_name+' - con score : '+influencee.kscore+'</p>';
			});
		}		
		$('influencer_of_klout').set('html', html);
	}

	
	
}

function info_user_engine(data) {
	
	var html = '<table border = "0" class = "table_desc_user">';
	html += '<tr>';
	html += '<td>Nombre:</td><td>'+data.name+'</td>';
	html += '</tr><tr>';
	html += '<td>Nick:</td><td>@'+data.screen_name+'</td>';
	html += '</tr><tr>';
	html += '<td>Ubicacion:</td><td>'+data.location+'</td>';
	html += '</tr><tr>';
	html += '<td>Followers:</td><td>'+data.followers_count+'</td>';
	html += '</tr><tr>';
	html += '<td>Friends:</td><td>'+data.friends_count+'</td>';
	html += '</tr><tr>';
	html += '<td>Cuenta verificada:</td><td>'+data.verified+'</td>';
	html += '</tr><tr>';

	if (data.status != undefined) {
		html += '<td>Ultimo Tweet:</td><td>'+data.status.text+'</td>';
	}
	html += '</tr><tr>';
	html += '<td>Numero tweets:</td><td>'+data.statuses_count+'</td>';
	html += '</tr><tr>';
	html += '<td>Descripcion:</td><td>'+data.description+'</td>';
	html += '</tr><tr>';
	html += '<td>Foto perfil:</td><td><img src = "'+data.profile_image_url+'"></td>';
	html += '</tr></table>';
	
	html += '<div id="accordion">';
	html += '	<h2>Klout Score</h2>';
	html += '	<div class="content">';
	html += '		<div id = "score_klout"></div>';
	html += '	</div>';
	html += '	<h2>Topics Klout</h2>';
	html += '	<div class="content">';
	html += '		<div id = "topics_klout"></div>';
	html += '	</div>';
	html += '	<h2>Influenciado Por:</h2>';
	html += '	<div class="content">';
	html += '		<div id = "influenced_by_klout"></div>';
	html += '	</div>';
	html += '	<h2>Influenciando a:</h2>';
	html += '	<div class="content">';
	html += '		<div id = "influencer_of_klout" > </div>';
	html += '	</div>';
	html += '</div>';
	$('detail_user_place').set('html', html);
	get_info_klout(data.screen_name);
	var myAccordion = new Fx.Accordion($('accordion'), '#accordion h2', '#accordion .content');
}

function myClusterClick(args) {
	close_infos();
	cluster.defaultClickAction=function(){
		map.setCenter(args.clusterMarker.getPosition(), map.fitBounds(args.clusterMarker.clusterGroupBounds))
		delete cluster.defaultClickAction;
	}
	var html='<div id = "places"><h4>'+args.clusteredMarkers.length+' Lugares</h4>';
	
	for (i=0; i<args.clusteredMarkers.length; i++) {
		html+='<a href="javascript:cluster.triggerClick('+args.clusteredMarkers[i].index+')">'+args.clusteredMarkers[i].title+'</a>';
	}
	html += '</div>';
	
	var infowindow = new google.maps.InfoWindow({
				content: html
			});
	 
	infowindow.open(map,args.clusterMarker);
	infos[0] = infowindow;
}
function close_infos() {
		if(infos.length > 0){
		  infos[0].set("marker",null);
		  infos[0].close();
		  infos.length = 0;
		}
	}
function createICon(label) {

	 
	  var primaryColor = "#14871c";
	  var strokeColor = "#000000";
	  var cornerColor = "#000000";
	  var shadowColor = "#000000";
	  var labelColor = "#000000";
	  var labelSize = label.length;
	  var width = 32+(labelSize*3);
	  var height =  32+(labelSize*3);
	  var shape = "circle";
	  var shapeCode = (shape === "circle") ? "it" : "itr";
	  var baseUrl = "http://chart.apis.google.com/chart?cht=" + shapeCode;
	  var iconUrl = baseUrl + "&chs=" + width + "x" + height + 
      "&chco=" + primaryColor.replace("#", "") + "," + 
      shadowColor.replace("#", "") + "ff,00000000" +
      "&chl=" + label + "&chx=" + labelColor.replace("#", "") + 
      "," + (labelSize+12) + "&chf=bg,s,00000000" + "&ext=.png";;

	 var icon = new google.maps.MarkerImage(iconUrl);	
	return icon;
}

 function showMarkers(init) {
     clearOverlays();  
	 var leng = array_twitters.length;	 
	
	 for (var i = 0; i < leng; i++) {
		 var iconImage = createICon(array_twitters[i].total);
		 var latlng = new google.maps.LatLng(aux_markers[i].marker.getPosition().lat(), aux_markers[i].marker.getPosition().lng());
		 var marker = new google.maps.Marker({
			position: latlng, 
			map: map,
			icon: iconImage,
			title:"marker from city"
			}); 
	 } 
	 
}
	
function markerClickFnCity(marker, name) {
		return function() {
  		 var infowindow = new google.maps.InfoWindow({
				content: name
			});
		 google.maps.event.addListener(marker, 'click', function() {
			infowindow.open(map,marker);
		 });
			
		};	
}

function clearOverlays() {
		if (markers.length >= 1) {
			l = markers.length;
			for (var i = 0; i < l; ++i) {
				markers[i].marker.setMap(null);
			}
		}	
}
