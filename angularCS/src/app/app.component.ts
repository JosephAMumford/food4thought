import { Component, OnInit } from '@angular/core';
import { MapService } from './map.service';
import { NgForm } from "@angular/forms";
import * as mapboxgl from 'mapbox-gl';
import MapboxGeocoder from 'mapbox-gl-geocoder';
import * as MapboxDraw from '@mapbox/mapbox-gl-draw';
// import { SITES } from '../assets/temp_sites'
import { UserLocation } from "./userLocation";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  userLoc : UserLocation = new UserLocation();
  mapToken : String;
  script: String;
  mealSites: any;
  map:mapboxgl.Map;
  mapService: MapService;
  // geocoder: MapboxGeocoder;

  constructor(private _mapService: MapService) {
    // this.mealSites = this._mapService.mealSites;
  }

  ngOnInit(){


    (mapboxgl as any).accessToken = this._mapService.mapToken;
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/vicagbasi/cjcjqksly12r62rloz0ps1xmm'

    });
    // This little number loads the data points onto the map :)
    console.log(this._mapService)
    this.map.on('load', (e)=> {
      this._mapService.getAllSites().then((geoData)=>{

      // Add the data to your map as a layer with embedded fork and knife!
      // **************************************************
      this.mealSites = geoData.json();
      this.map.addLayer({
        id: 'locations',
        type: 'symbol',
        // Add a GeoJSON source containing place coordinates and information.
        source: {
          type: 'geojson',
          data: this.mealSites
        },
        layout: {
          'icon-image': 'restaurant-15',
          'icon-allow-overlap': true,
        }
      });
      this.buildLocationList(this.mealSites);
      // Add zoom and rotation controls to the map.
      this.map.addControl(new mapboxgl.NavigationControl());
    });
    // add geocoder controls
    const geocoder = new MapboxGeocoder({
      accessToken: this._mapService.mapToken,
      // bbox: [[33.932536, -103.007813], [37.097360, -94.438477]]
    });

    this.map.addControl(geocoder, 'top-left');


  })
    // Add an event listener for the links in the sidebar listing
    this.map.on('click', (e) => {
      var features = this.map.queryRenderedFeatures(e.point, {
        layers: ['locations']
      });

      if (features.length) {
        var clickedPoint = features[0];


        // 2. Close all other popups and display popup for clicked store
        this.createPopUp(clickedPoint);

        // 1. Fly to the point
        this.flyToStore(clickedPoint);

        // 3. Highlight listing in sidebar (and remove highlight for all other listings)
       var activeItem = document.getElementsByClassName('active');
        if (activeItem[0]) {
          activeItem[0].classList.remove('active');
        }

        var selectedFeature = clickedPoint.properties.Address;
        let selectedFeatureIndex;
        for (var i = 0; i < features.length; i++ ) {
          if (features[i].properties.Address === selectedFeature) {
              selectedFeatureIndex = i;
          }
        }

        var listing = document.getElementById('listing-' + selectedFeatureIndex);
        listing.classList.add('active');

      }
    });

  // end ngOnInit

}
  flyToStore(currentFeature) {
  console.log(this.map)
  this.map.flyTo({
      center: currentFeature.geometry.coordinates,
      zoom: 15
    });
  }

  createPopUp(currentFeature) {
    var popUps = document.getElementsByClassName('mapboxgl-popup');
    // Check if there is already a popup on the map and if so, remove it
    if (popUps[0]) popUps[0].remove();

    var popup = new mapboxgl.Popup({ closeOnClick: false })
      .setLngLat(currentFeature.geometry.coordinates)
      .setHTML('<h3>'+currentFeature.properties.Name+'</h3>' +
        '<h5>' + currentFeature.properties.Address + '</h5>')
      .addTo(this.map);
  }

  buildLocationList(data) {
    for (var i = 0; i < data.features.length; i++) {
      // Create an array of all the stores and their properties
      var currentFeature = data.features[i];
      // Shorten data.feature.properties to just `prop` so we're not
      // writing this long form over and over again.
      var prop = currentFeature.properties;
      // Select the listing container in the HTML
      var listings = document.getElementById('listings');
      // Append a div with the class 'item' for each store
      var listing = listings.appendChild(document.createElement('div'));
      listing.className = 'item';
      listing.id = "listing-" + i;

      // Create a new link with the class 'title' for each store
      // and fill it with the store address
      var link = listing.appendChild(document.createElement('a'));
      link.href = '#';
      link.className = 'title';
      link.setAttribute("dataPosition", i.toString());
      link.innerHTML = prop.Name;

      // Create a new div with the class 'details' for each store
      // and fill it with the city and phone number
      var details = listing.appendChild(document.createElement('div'));
      details.innerHTML = prop.Address;
      if (prop.Phone) {
        details.innerHTML += ' &middot; ' + prop.Phone+"<hr>";
      }


      link.addEventListener('click', (e) => {
        // Update the currentFeature to the store associated with the clicked link
        console.log("link event", e)
        var clickedListing = this.mealSites.features[Number.parseInt(e.srcElement.getAttribute("dataPosition"))];
        console.log(clickedListing);
        console.log(Number.parseInt(link.getAttribute("dataPosition")));
        console.log(data);
        console.log(link.getAttribute("dataPosition"));
        // 1. Fly to the point associated with the clicked link
        this.flyToStore(clickedListing);

        // 2. Close all other popups and display popup for clicked store
        this.createPopUp(clickedListing);

        // 3. Highlight listing in sidebar (and remove highlight for all other listings)
        var activeItem = document.getElementsByClassName('active');

        if (activeItem[0]) {
          activeItem[0].classList.remove('active');
        }
        link.parentElement.classList.add('active');

      });
    }
  }



}