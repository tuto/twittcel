/*
	ClusterMarker Version 1.3.2

	A marker manager for the Google Maps API
	http://googlemapsapi.martinpearman.co.uk/clustermarker

	Copyright Martin Pearman 2008
	Last updated 29th September 2008

	This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

	This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

	You should have received a copy of the GNU General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

function ClusterMarker($map, $options){
	this._map = $map;
	this._mapMarkers = [];
	this._iconBounds = [];
	this._clusterMarkers = [];
	this._eventListeners = [];

	if (typeof($options) === 'undefined') {
		$options={};
	}

	this.borderPadding = ($options.borderPadding) ? $options.borderPadding : 256;
	this.clusteringEnabled = ($options.clusteringEnabled === false) ? false : true;

	if ($options.clusterMarkerClick) {
		this.clusterMarkerClick=$options.clusterMarkerClick;
	}

	if ($options.clusterMarkerIcon) {
		this.clusterMarkerIcon=$options.clusterMarkerIcon;
	} else {
/*
		this.clusterMarkerIcon=new GIcon();
		this.clusterMarkerIcon.image='http://maps.google.com/mapfiles/arrow.png';
		this.clusterMarkerIcon.iconSize=new GSize(39, 34);
		this.clusterMarkerIcon.iconAnchor=new GPoint(9, 31);
		this.clusterMarkerIcon.infoWindowAnchor=new GPoint(9, 31);
		this.clusterMarkerIcon.shadow='http://www.google.com/intl/en_us/mapfiles/arrowshadow.png';
		this.clusterMarkerIcon.shadowSize=new GSize(39, 34);
*/
		this.clusterMarkerIcon = new google.maps.MarkerImage('images/group.png',
			new google.maps.Size(39, 34),
			new google.maps.Point(0, 0),	// origin
			new google.maps.Point(9, 31)  // anchor
		);

		//this.clusterMarkerIconShadow = new google.maps.MarkerImage('images/arrowshadow.png',
			//new google.maps.Size(39, 34),
			//new google.maps.Point(0, 0),
			//new google.maps.Point(9, 31)
		//);

	}

	this.clusterMarkerTitle = ($options.clusterMarkerTitle) ? $options.clusterMarkerTitle : 'Click to zoom in and see %count markers';

	if ($options.fitMapMaxZoom) {
		this.fitMapMaxZoom = $options.fitMapMaxZoom;
	}

	this.intersectPadding = ($options.intersectPadding) ? $options.intersectPadding : 0;

	if ($options.markers) {
		this.addMarkers($options.markers);
	}
/*
	GEvent.bind(this._map, 'moveend', this, this._moveEnd);
	GEvent.bind(this._map, 'zoomend', this, this._zoomEnd);
	GEvent.bind(this._map, 'maptypechanged', this, this._mapTypeChanged);
*/

	var $this = this;

	google.maps.event.addListener(this._map, 'dragend', function() {
		if (!$this._cancelMoveEnd) {
			$this.refresh();
		} else {
			$this._cancelMoveEnd = false;
		}
	});
	google.maps.event.addListener(this._map, 'zoom_changed', function() {
		$this._cancelMoveEnd = true;
		$this.refresh(true);
	});
	google.maps.event.addListener(this._map, 'maptypeid_changed', function() {
		$this.refresh(true);
	});

}

ClusterMarker.prototype.addMarkers = function($markers) {
	var i;

	if (!$markers[0]) {
		//	assume $markers is an associative array and convert to a numerically indexed array
		var $numArray=[];

		for (i in $markers) {
			$numArray.push($markers[i]);
		}
		$markers = $numArray;
	}

	for (i=$markers.length-1; i>=0; i--) {
		$markers[i]._isVisible = false;
		$markers[i]._isActive = false;
		$markers[i]._makeVisible = false;
	}

	this._mapMarkers = this._mapMarkers.concat($markers);
};

ClusterMarker.prototype._clusterMarker = function($clusterGroupIndexes) {
/*
	function $newClusterMarker($location, $icon, $title) {
		return new GMarker($location, {icon:$icon, title:$title});
	}
*/
	function $newClusterMarker($location, $icon, $shadow, $title) {
		return new google.maps.Marker({
			icon: $icon,
			shadow: $shadow,
			position: $location,
			map: $this._map,
			title: $title
		});
	}

//	var $clusterGroupBounds=new GLatLngBounds(), i, $clusterMarker, $clusteredMarkers=[], $marker, $this=this, $mapMarkers=this._mapMarkers;
	var $clusterGroupBounds = new google.maps.LatLngBounds();
	var i;
	var $clusterMarker;
	var $clusteredMarkers = [];
	var $marker;
	var $this = this;
	var $mapMarkers = this._mapMarkers;

	for (i=$clusterGroupIndexes.length-1; i>=0; i--) {
		$marker = $mapMarkers[$clusterGroupIndexes[i]];
		$marker.index = $clusterGroupIndexes[i];
//		$clusterGroupBounds.extend($marker.getLatLng());
		$clusterGroupBounds.extend($marker.getPosition());
		$clusteredMarkers.push($marker);
	}

//	$clusterMarker = $newClusterMarker($clusterGroupBounds.getCenter(), this.clusterMarkerIcon, this.clusterMarkerTitle.replace(/%count/gi, $clusterGroupIndexes.length));
	$clusterMarker = $newClusterMarker($clusterGroupBounds.getCenter(), this.clusterMarkerIcon, this.clusterMarkerIconShadow, this.clusterMarkerTitle.replace(/%count/gi, $clusterGroupIndexes.length));
	$clusterMarker.clusterGroupBounds=$clusterGroupBounds;	//	only req'd for default cluster marker click action

	this._eventListeners.push(google.maps.event.addListener($clusterMarker, 'click', function() {
		$this.clusterMarkerClick({clusterMarker:$clusterMarker, clusteredMarkers:$clusteredMarkers });
	}));

	$clusterMarker._childIndexes=$clusterGroupIndexes;

	for (i=$clusterGroupIndexes.length-1; i>=0; i--) {
		$mapMarkers[$clusterGroupIndexes[i]]._parentCluster=$clusterMarker;
	}
	return $clusterMarker;
};

ClusterMarker.prototype.clusterMarkerClick = function($args) {
//	this._map.setCenter($args.clusterMarker.getLatLng(), this._map.getBoundsZoomLevel($args.clusterMarker.clusterGroupBounds));
	this._map.fitBounds($args.clusterMarker.clusterGroupBounds);
};

ClusterMarker.prototype._filterActiveMapMarkers = function() {
//	var $borderPadding=this.borderPadding, $mapZoomLevel=this._map.getZoom(), $mapProjection=this._map.getCurrentMapType().getProjection(), $mapPointSw, $activeAreaPointSw, $activeAreaLatLngSw, $mapPointNe, $activeAreaPointNe, $activeAreaLatLngNe, $activeAreaBounds=this._map.getBounds(), i, $marker, $uncachedIconBoundsIndexes=[], $oldState, $mapMarkers=this._mapMarkers, $iconBounds=this._iconBounds;
	var $borderPadding = this.borderPadding;
	var $mapZoomLevel = this._map.getZoom();
//	var $mapProjection=this._map.getCurrentMapType().getProjection();
	var $mapProjection = this._map.getProjection();
	var $mapPointSw;
	var $activeAreaPointSw;
	var $activeAreaLatLngSw;
	var $mapPointNe;
	var $activeAreaPointNe;
	var $activeAreaLatLngNe;
	var $activeAreaBounds = this._map.getBounds();
	var i;
	var $marker;
	var $uncachedIconBoundsIndexes = [];
	var $oldState;
	var $mapMarkers = this._mapMarkers;
	var $iconBounds = this._iconBounds;
	
	if ($borderPadding) {
/*
		$mapPointSw 				= $mapProjection.fromLatLngToPixel($activeAreaBounds.getSouthWest(), $mapZoomLevel);
		$activeAreaPointSw 	= new GPoint($mapPointSw.x-$borderPadding, $mapPointSw.y+$borderPadding);
		$activeAreaLatLngSw	= $mapProjection.fromPixelToLatLng($activeAreaPointSw, $mapZoomLevel);

		$mapPointNe 				= $mapProjection.fromLatLngToPixel($activeAreaBounds.getNorthEast(), $mapZoomLevel);
		$activeAreaPointNe 	= new GPoint($mapPointNe.x+$borderPadding, $mapPointNe.y-$borderPadding);
		$activeAreaLatLngNe = $mapProjection.fromPixelToLatLng($activeAreaPointNe, $mapZoomLevel);
*/
    $multiplier = Math.pow(2, $mapZoomLevel);

		$mapPointSw						= $mapProjection.fromLatLngToPoint($activeAreaBounds.getSouthWest());
    $mapPointSw.x    			= $mapPointSw.x * $multiplier; 
    $mapPointSw.y    			= $mapPointSw.y * $multiplier; 

		$activeAreaPointSw 	  = new google.maps.Point($mapPointSw.x - $borderPadding, $mapPointSw.y + $borderPadding);

    $activeAreaPointSw.x  = $activeAreaPointSw.x / $multiplier;
    $activeAreaPointSw.y  = $activeAreaPointSw.y / $multiplier;
		$activeAreaLatLngSw   = $mapProjection.fromPointToLatLng($activeAreaPointSw);

		$mapPointNe						= $mapProjection.fromLatLngToPoint($activeAreaBounds.getNorthEast());
    $mapPointNe.x    			= $mapPointNe.x * $multiplier; 
    $mapPointNe.y    			= $mapPointNe.y * $multiplier; 

		$activeAreaPointNe 		= new google.maps.Point($mapPointNe.x - $borderPadding, $mapPointNe.y + $borderPadding);

    $activeAreaPointNe.x 	= $activeAreaPointNe.x / $multiplier;
    $activeAreaPointNe.y 	= $activeAreaPointNe.y / $multiplier;
		$activeAreaLatLngNe 	= $mapProjection.fromPointToLatLng($activeAreaPointNe);

		$activeAreaBounds.extend($activeAreaLatLngSw);
		$activeAreaBounds.extend($activeAreaLatLngNe);
	}

	this._activeMarkersChanged = false;

	if (typeof($iconBounds[$mapZoomLevel]) === 'undefined') {
		//	no iconBounds cached for this zoom level
		//	no need to check for existence of individual iconBounds elements
		this._iconBounds[$mapZoomLevel] = [];
		this._activeMarkersChanged=true;	//	force refresh(true) as zoomed to uncached zoom level

		for (i=$mapMarkers.length-1; i>=0; i--) {
			$marker = $mapMarkers[i];
//			$marker._isActive = $activeAreaBounds.containsLatLng($marker.getLatLng()) ? true : false;
			$marker._isActive = $activeAreaBounds.contains($marker.getPosition()) ? true : false;
			$marker._makeVisible = $marker._isActive;

			if ($marker._isActive) {
				$uncachedIconBoundsIndexes.push(i);
			}
		}
	}else{
		//	icondBounds array exists for this zoom level
		//	check for existence of individual iconBounds elements
		for (i = $mapMarkers.length-1; i>=0; i--) {
			$marker = $mapMarkers[i];
			$oldState = $marker._isActive;
//			$marker._isActive = $activeAreaBounds.containsLatLng($marker.getLatLng()) ? true : false;
			$marker._isActive = $activeAreaBounds.contains($marker.getPosition()) ? true : false;
			$marker._makeVisible = $marker._isActive;

			if (!this._activeMarkersChanged && $oldState !== $marker._isActive) {
				this._activeMarkersChanged = true;
			}

			if ($marker._isActive && typeof($iconBounds[$mapZoomLevel][i]) === 'undefined') {
				$uncachedIconBoundsIndexes.push(i);
			}
		}
	}
	return $uncachedIconBoundsIndexes;
};

ClusterMarker.prototype._filterIntersectingMapMarkers = function() {
//	var $clusterGroup, i, j, $mapZoomLevel=this._map.getZoom(), $mapMarkers=this._mapMarkers, $iconBounds=this._iconBounds;
	var $clusterGroup;
	var i;
	var j;
	var $mapZoomLevel=this._map.getZoom();
	var $mapMarkers=this._mapMarkers;
	var $iconBounds=this._iconBounds;

	for (i=$mapMarkers.length-1; i>0; i--) {
		if ($mapMarkers[i]._makeVisible) {
			$clusterGroup = [];
			for (j=i-1; j>=0; j--) {
				if ($mapMarkers[j]._makeVisible && $iconBounds[$mapZoomLevel][i].intersects($iconBounds[$mapZoomLevel][j])) {
					$clusterGroup.push(j);
				}
			}
			if ($clusterGroup.length !== 0) {
				$clusterGroup.push(i);
				for (j=$clusterGroup.length-1; j>=0; j--) {
					$mapMarkers[$clusterGroup[j]]._makeVisible = false;
				}
				this._clusterMarkers.push(this._clusterMarker($clusterGroup));
			}
		}
	}
};

ClusterMarker.prototype.fitMapToMarkers = function() {

//	var $mapMarkers=this._mapMarkers, $markersBounds=new GLatLngBounds(), i;
	var $mapMarkers = this._mapMarkers;
	var $markersBounds = new google.maps.LatLngBounds();
	var i;

	for (i=$mapMarkers.length-1; i>=0; i--) {
//		$markersBounds.extend($mapMarkers[i].getLatLng());
		$markersBounds.extend($mapMarkers[i].getPosition());
	}
//	var $fitMapToMarkersZoom=this._map.getBoundsZoomLevel($markersBounds);

//	if(this.fitMapMaxZoom && $fitMapToMarkersZoom>this.fitMapMaxZoom){
//		$fitMapToMarkersZoom=this.fitMapMaxZoom;
//	}
//	this._map.setCenter($markersBounds.getCenter(), $fitMapToMarkersZoom);
	this._map.fitBounds($markersBounds);
	this.refresh();
};

ClusterMarker.prototype._preCacheIconBounds = function($indexes, $mapZoomLevel) {
//	var $mapProjection=this._map.getCurrentMapType().getProjection(), i, $marker, $iconSize, $iconAnchorPoint, $iconAnchorPointOffset, $iconBoundsPointSw, $iconBoundsPointNe, $iconBoundsLatLngSw, $iconBoundsLatLngNe, $intersectPadding=this.intersectPadding, $mapMarkers=this._mapMarkers;
	var $mapProjection = this._map.getProjection();
	var i;
	var $marker;
	var $iconSize;
	var $iconAnchorPoint;
	var $iconAnchorPointOffset;
	var $iconBoundsPointSw;
	var $iconBoundsPointNe;
	var $iconBoundsLatLngSw;
	var $iconBoundsLatLngNe;
	var $intersectPadding = this.intersectPadding;
	var $mapMarkers=this._mapMarkers;

	for (i=$indexes.length-1; i>=0; i--) {
		$marker 								= $mapMarkers[$indexes[i]];
/*
		$iconSize 							= $marker.getIcon().iconSize;
		$iconAnchorPoint 				= $mapProjection.fromLatLngToPixel($marker.getLatLng(), $mapZoomLevel);
		$iconAnchorPointOffset	= $marker.getIcon().iconAnchor;
		$iconBoundsPointSw 			= new GPoint($iconAnchorPoint.x-$iconAnchorPointOffset.x-$intersectPadding, $iconAnchorPoint.y-$iconAnchorPointOffset.y+$iconSize.height+$intersectPadding);
		$iconBoundsPointNe 			= new GPoint($iconAnchorPoint.x-$iconAnchorPointOffset.x+$iconSize.width+$intersectPadding, $iconAnchorPoint.y-$iconAnchorPointOffset.y-$intersectPadding);
		$iconBoundsLatLngSw 		= $mapProjection.fromPixelToLatLng($iconBoundsPointSw, $mapZoomLevel);
		$iconBoundsLatLngNe 		= $mapProjection.fromPixelToLatLng($iconBoundsPointNe, $mapZoomLevel);
*/

    $multiplier = Math.pow(2, $mapZoomLevel);

		$iconSize 							= new google.maps.Size(20, 34);

    $iconAnchorPoint 				= $mapProjection.fromLatLngToPoint($marker.getPosition());
    $iconAnchorPoint.x      = $iconAnchorPoint.x * $multiplier; 
    $iconAnchorPoint.y      = $iconAnchorPoint.y * $multiplier; 
    
    $iconAnchorPoint.x      = Math.round($iconAnchorPoint.x);
    $iconAnchorPoint.y      = Math.round($iconAnchorPoint.y);
    
		$iconAnchorPointOffset	= new google.maps.Size(9, 34);
    $iconBoundsPointSw 			= new google.maps.Point($iconAnchorPoint.x-$iconAnchorPointOffset.width-$intersectPadding, $iconAnchorPoint.y-$iconAnchorPointOffset.height+$iconSize.height+$intersectPadding);
    $iconBoundsPointNe 			= new google.maps.Point($iconAnchorPoint.x-$iconAnchorPointOffset.width+$iconSize.width+$intersectPadding, $iconAnchorPoint.y-$iconAnchorPointOffset.height-$intersectPadding);
		
    $iconBoundsPointSw.x    = $iconBoundsPointSw.x / $multiplier;
    $iconBoundsPointSw.y    = $iconBoundsPointSw.y / $multiplier;
    $iconBoundsLatLngSw 		= $mapProjection.fromPointToLatLng($iconBoundsPointSw);
    
    $iconBoundsPointNe.x    = $iconBoundsPointNe.x / $multiplier;
    $iconBoundsPointNe.y    = $iconBoundsPointNe.y / $multiplier;
    $iconBoundsLatLngNe 		= $mapProjection.fromPointToLatLng($iconBoundsPointNe);

 		this._iconBounds[$mapZoomLevel][$indexes[i]] = new google.maps.LatLngBounds($iconBoundsLatLngSw, $iconBoundsLatLngNe);
	}
};

ClusterMarker.prototype.getMaxZoom = function(mapType) {
	switch (mapType) {
		case 'hybrid': return this._map.mapTypes.hybrid.maxZoom;
		case 'roadmap': return this._map.mapTypes.roadmap.maxZoom;
		case 'satellite': return this._map.mapTypes.satellite.maxZoom;
		case 'terrain': return this._map.mapTypes.terrain.maxZoom;
	}
};

ClusterMarker.prototype.refresh = function($forceFullRefresh) {
//	var i, $marker, $zoomLevel=this._map.getZoom(), $uncachedIconBoundsIndexes=this._filterActiveMapMarkers();
	var i;
	var $marker;
	var $zoomLevel = this._map.getZoom();
	var $uncachedIconBoundsIndexes = this._filterActiveMapMarkers();

	if (this._activeMarkersChanged || $forceFullRefresh) {
		this._removeClusterMarkers();
//		if (this.clusteringEnabled && $zoomLevel < this._map.getCurrentMapType().getMaximumResolution()) {
		if (this.clusteringEnabled && $zoomLevel < this.getMaxZoom(this._map.getMapTypeId())) {
			if ($uncachedIconBoundsIndexes.length > 0) {
				this._preCacheIconBounds($uncachedIconBoundsIndexes, $zoomLevel);
			}
			this._filterIntersectingMapMarkers();
		}

		for (i=this._clusterMarkers.length-1; i>=0; i--) {
//			this._map.addOverlay(this._clusterMarkers[i]);
			this._clusterMarkers[i].setVisible(true);
		}

		for (i=this._mapMarkers.length-1; i>=0; i--) {
			$marker=this._mapMarkers[i];

			if (!$marker._isVisible && $marker._makeVisible) {
//				this._map.addOverlay($marker);
				$marker.setVisible(true);
				$marker._isVisible=true;
			}

			if ($marker._isVisible && !$marker._makeVisible) {
//				this._map.removeOverlay($marker);
				$marker.setVisible(false);
				$marker._isVisible=false;
			}
		}
	}
};

ClusterMarker.prototype._removeClusterMarkers = function() {
//	var i, j, $map=this._map, $eventListeners=this._eventListeners, $clusterMarkers=this._clusterMarkers, $childIndexes, $mapMarkers=this._mapMarkers;
	var i;
	var j;
	var $map = this._map;
	var $eventListeners = this._eventListeners;
	var $clusterMarkers = this._clusterMarkers;
	var $childIndexes;
	var $mapMarkers = this._mapMarkers;

	for (i=$clusterMarkers.length-1; i>=0; i--) {
		$childIndexes=$clusterMarkers[i]._childIndexes;
		for (j=$childIndexes.length-1; j>=0; j--) {
			delete $mapMarkers[$childIndexes[j]]._parentCluster;
		}
//		$map.removeOverlay($clusterMarkers[i]);
		$clusterMarkers[i].setMap(null);
	}

	for (i=$eventListeners.length-1; i>=0; i--) {
//		GEvent.removeListener($eventListeners[i]);
		google.maps.event.removeListener($eventListeners[i]);
	}

	this._clusterMarkers = [];
	this._eventListeners = [];
};

ClusterMarker.prototype.removeMarkers=function(){
//	var i, $mapMarkers=this._mapMarkers, $map=this._map;
	var i;
	var $mapMarkers = this._mapMarkers;
	var $map = this._map;

	for (i=$mapMarkers.length-1; i>=0; i--) {
		if($mapMarkers[i]._isVisible){
//			$map.removeOverlay($mapMarkers[i]);
			$mapMarkers[i].setMap(null);
		}
		delete $mapMarkers[i]._isVisible;
		delete $mapMarkers[i]._isActive;
		delete $mapMarkers[i]._makeVisible;
	}

	this._removeClusterMarkers();
	this._mapMarkers=[];
	this._iconBounds=[];
};

ClusterMarker.prototype.triggerClick = function($index) {
	var $marker = this._mapMarkers[$index];

	if ($marker._isVisible) {
		//	$marker is visible
		google.maps.event.trigger($marker, 'click');
	}
	else if ($marker._isActive) {
		//	$marker is clustered
//		var $clusteredMarkersIndexes=$marker._parentCluster._childIndexes, $intersectDetected=true, $uncachedIconBoundsIndexes, i, $mapZoomLevel=this._map.getZoom(), $clusteredMarkerIndex, $iconBounds=this._iconBounds, $mapMaxZoomLevel=this._map.getCurrentMapType().getMaximumResolution();
		var $clusteredMarkersIndexes = $marker._parentCluster._childIndexes;
		var $intersectDetected = true;
		var $uncachedIconBoundsIndexes;
		var i;
		var $mapZoomLevel = this._map.getZoom();
		var $clusteredMarkerIndex;
		var $iconBounds=this._iconBounds;
		var $mapTypeId = this._map.mapTypeId;
		var $mapMaxZoomLevel = 0;
		
		if ($mapTypeId == 'roadmap') {
			$mapMaxZoomLevel = this._map.mapTypes.roadmap.maxZoom;
		}
		if ($mapTypeId == 'satellite') {
			$mapMaxZoomLevel = this._map.mapTypes.roadmap.maxZoom;
		}
		if ($mapTypeId == 'terrain') {
			$mapMaxZoomLevel = this._map.mapTypes.roadmap.maxZoom;
		}

		while ($intersectDetected && $mapZoomLevel<$mapMaxZoomLevel) {
			$intersectDetected = false;
			$mapZoomLevel++;

			if (typeof($iconBounds[$mapZoomLevel]) === 'undefined') {
				//	no iconBounds cached for this zoom level
				//	no need to check for existence of individual iconBounds elements
				$iconBounds[$mapZoomLevel] = [];
				// need to create cache for all clustered markers at $mapZoomLevel
				this._preCacheIconBounds($clusteredMarkersIndexes, $mapZoomLevel);
			} else {
				//	iconBounds array exists for this zoom level
				//	check for existence of individual iconBounds elements
				$uncachedIconBoundsIndexes = [];
				for (i=$clusteredMarkersIndexes.length-1; i>=0; i--) {
					if (typeof($iconBounds[$mapZoomLevel][$clusteredMarkersIndexes[i]]) === 'undefined') {
						$uncachedIconBoundsIndexes.push($clusteredMarkersIndexes[i]);
					}
				}
				if ($uncachedIconBoundsIndexes.length >= 1) {
					this._preCacheIconBounds($uncachedIconBoundsIndexes, $mapZoomLevel);
				}
			}

			for (i=$clusteredMarkersIndexes.length-1; i>=0; i--) {
				$clusteredMarkerIndex=$clusteredMarkersIndexes[i];
				if ($clusteredMarkerIndex !== $index && $iconBounds[$mapZoomLevel][$clusteredMarkerIndex].intersects($iconBounds[$mapZoomLevel][$index])){
					$intersectDetected=true;
					break;
				}
			}

		};
//		this._map.setCenter($marker.getLatLng(), $mapZoomLevel);
		this._map.setCenter($marker.getPosition());
		this._map.setZoom($mapZoomLevel);
		this.triggerClick($index);
	} else {
		// $marker is not within active area (map bounds + border padding)
//		this._map.setCenter($marker.getLatLng());
		this._map.setCenter($marker.getPosition());
		this.triggerClick($index);
	}
};

/*
ClusterMarker.prototype._mapTypeChanged = function() {
	this.refresh(true);
};

ClusterMarker.prototype._moveEnd = function() {
	if (!this._cancelMoveEnd) {
		this.refresh();
	} else {
		this._cancelMoveEnd = false;
	}
};

ClusterMarker.prototype._zoomEnd = function() {
	this._cancelMoveEnd = true;
	this.refresh(true);
};
*/
