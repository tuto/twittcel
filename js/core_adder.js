var geocoder;
var map;
function load() {
	geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(-34.397, 150.644);
    var myOptions = {
      zoom: 8,
      center: latlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    map = new google.maps.Map(document.getElementById("map"), myOptions);

}
function codeAddress() {
    var address = document.getElementById("comuna").value;
    geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
			map.setCenter(results[0].geometry.location);
			var marker = new google.maps.Marker({
				map: map, 
				position: results[0].geometry.location    
			});
			$('lat').value = marker.getPosition().lat();  
			$('lon').value = marker.getPosition().lng();
			var strs = address.split(',');
			$('slug').value = string_to_slug(strs[0]);
			$('comuna').value = strs[0];
      } else {
        alert("Geocode was not successful for the following reason: " + status);
      }
    });
  }
function string_to_slug(str) {
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();
  
  // remove accents, swap ñ for n, etc
  var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
  var to   = "aaaaeeeeiiiioooouuuunc------";
  for (var i=0, l=from.length ; i<l ; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

  return str;
}  

function save() {
	
	var req = new Request({
				url:'adder_request.php',
				method:'post',
				onSuccess: function(responseText, responseXML){
							
							if (responseText == 'OK') {	
								$('comuna').focus();
								$('comuna').value = ", Chile";
								$('slug').value = "";
								$('lat').value = "";
								$('lon').value = "";
								
							}
							else {
									alert("algo malo salio"+responseText);
							}	
						}		 
			});
				
		req.send('comuna='+$('comuna').value+'&slug='+$('slug').value+'&lat='+$('lat').value+'&lon='+$('lon').value);	
}

