let map;
let currentPosition;
let selectedRestaurant;
let marker; //mark the resturant location on the map
let directionService; //get the route
let directionsRenderer; // plot the route
let infoWindow;
const colors = ["#fff2cc", "#f3dfa3", "#bd91e4", "#9c78bd"];



const restaurantList = JSON.parse(localStorage.getItem('restaurantList')) || [];
restaurantList.forEach(function(restaurant) {
    document.querySelector("#favorite-list").innerHTML += `
    <li class="list-group-item">
    ${restaurant.name}<button class="btn-close float-end remove"></button>
    </li>
    `
});


function initMap() {
    map = new google.maps.Map(document.querySelector("#map"), {
        center: {lat: 23.553118, lng: 121.0211024},
        zoom:7
    });

    navigator.geolocation.getCurrentPosition(function(position) {
        currentPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        map.setCenter(currentPosition);
        map.setZoom(16);

        const autocomplete = new google.maps.places.Autocomplete(
            document.querySelector("#search-input"), 
            {
                types: ['restaurant'],
                bounds: {
                    east: currentPosition.lng + 0.001,
                    west: currentPosition.lng - 0.001,
                    south: currentPosition.lat - 0.001,
                    north: currentPosition.lat + 0.001
                },
                strictBounds: false,
            }
        );

        // autocomplete 加上監聽 若使用者點擊餐廳選項則觸發function
        autocomplete.addListener('place_changed', function(){
            const place = autocomplete.getPlace();
            selectedRestaurant = {
                location: place.geometry.location,
                placeId: place.place_id,
                name: place.name,
                address: place.formatted_address,
                phoneNumber: place.formatted_phone_number,
                rating: place.rating
            };

            document.querySelector("#view").addEventListener('click', function () {
                map.setCenter(selectedRestaurant.location);
                if(!marker) {
                    marker = new google.maps.Marker({
                        map: map
                    });
                }
                marker.setPosition(selectedRestaurant.location);

                if(!directionService) {
                    directionService = new google.maps.DirectionsService();
                }
    
                if(!directionsRenderer) {
                    directionsRenderer = new google.maps.DirectionsRenderer({
                        map: map
                    });
                }
     
                directionsRenderer.set('directions',null);
    
                directionService.route(
                    {
                    origin: new google.maps.LatLng(
                        currentPosition.lat,
                        currentPosition.lng
                    ),
                    destination:{
                        placeId: selectedRestaurant.placeId
                    },
                    travelMode: 'WALKING'
                    }, function(response, status) {
                        if(status === 'OK') {
                            directionsRenderer.setDirections(response);
                            
                            if(!infoWindow) {
                                infoWindow = new google.maps.InfoWindow();
                            }
                            infoWindow.setContent(
                                `
                                <h4>${selectedRestaurant.name}</h4>
                                <div>Address: ${selectedRestaurant.address}</div>
                                <div>Phone: ${selectedRestaurant.phoneNumber}</div>
                                <div>Rating: ${selectedRestaurant.rating}</div>
                                <div>Travel Time: ${response.routes[0].legs[0].duration.text}</div>
                                `
                            );
    
                            infoWindow.open(map, marker);
                        }
                    });
                document.querySelector("#map").scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });
    });
}



const wheel = new Winwheel({
    numSegments: restaurantList.length,
    segments: restaurantList.map((restaurant, index) => {
        return {
            fillStyle: colors[index % 4],
            textAlignment: 'outer',
            textOrientation: 'curved',
            text: restaurant.name,
            strokeStyle: 'white',
            textFontSize: 20
        };
    }),
    animation: {
        type: 'spinToStop',
        spins: 6,
        easing: 'Power4.easeInOut',
        callbackFinished: function(segment) {
            document.querySelector("#map").scrollIntoView({
                behavior: 'smooth'
            });
            window.alert(segment.text);
            wheel.rotationAngle = 0;
            wheel.draw();

            const restaurantList = JSON.parse(localStorage.getItem('restaurantList')) || [];
            selectedRestaurant = restaurantList.find(function(restaurant) {
                return restaurant.name === segment.text;
            });

            map.setCenter(selectedRestaurant.location);

            if(!marker) {
                marker = new google.maps.Marker({
                    map: map
                });
            }
            marker.setPosition(selectedRestaurant.location);

            if(!directionService) {
                directionService = new google.maps.DirectionsService();
            }

            if(!directionsRenderer) {
                directionsRenderer = new google.maps.DirectionsRenderer({
                    map: map
                });
            }
 
            directionsRenderer.set('directions',null);

            directionService.route(
                {
                origin: new google.maps.LatLng(
                    currentPosition.lat,
                    currentPosition.lng
                ),
                destination:{
                    placeId: selectedRestaurant.placeId
                },
                travelMode: 'WALKING'
                }, 
                function(response, status) {
                    if(status === 'OK') {
                        directionsRenderer.setDirections(response);
                        
                        if(!infoWindow) {
                            infoWindow = new google.maps.InfoWindow();
                        }
                        infoWindow.setContent(
                            `
                            <h3>${selectedRestaurant.name}</h3>
                            <div>Address: ${selectedRestaurant.address}</div>
                            <div>Phone:${selectedRestaurant.phoneNumber}</div>
                            <div>Rating:${selectedRestaurant.rating}</div>
                            <div>Travel Time:${response.routes[0].legs[0].duration.text}</div>
                            `
                        );

                        infoWindow.open(map, marker);
                    }
            });
        }
    }
    
});



// add to Favorite List
document.querySelector("#add.btn").addEventListener('click', function() {
    document.querySelector("#favorite-list").innerHTML += `
    <li class="list-group-item">
    ${selectedRestaurant.name}<button class="btn-close float-end remove"></button>
    </li>
    `
    document.querySelector("#search-input").value = " ";
    const restaurantList = JSON.parse(localStorage.getItem('restaurantList')) || [];
    const color = colors[restaurantList.length % 4];
    wheel.addSegment({
        textAlignment: 'outer',
        textOrientation: 'curved',
        fillStyle: color,
        text: selectedRestaurant.name,
        strokeStyle: 'white',
        textFontSize: 20,
    });
    wheel.draw();
    restaurantList.push(selectedRestaurant);
    localStorage.setItem('restaurantList', JSON.stringify(restaurantList));
});



// remove from list
document.querySelector("#favorite-list").addEventListener('click', function(e) {
    if(e.target.classList.contains('remove')) {
        //找到他的parent 然後移除
        e.target.parentNode.remove();
        const restaurantDelete = e.target.parentNode.innerText.trim();
        const restaurantList = JSON.parse(localStorage.getItem('restaurantList')) || [];

        const deleteIndex = restaurantList.findIndex(function(restaurant) {
            return restaurant.name === restaurantDelete;
        });


        wheel.deleteSegment(deleteIndex + 1); // wheel segment number start from 1
        wheel.draw();
        
        const newRestaurnatList = restaurantList.filter(function(restaurant) {
            if (restaurant.name === restaurantDelete) return false;
            return true;
        });
        localStorage.setItem('restaurantList', JSON.stringify(newRestaurnatList));
    }
    location.reload();
});



// clear all data in localStorage and the wheel
document.querySelector("#remove-all").addEventListener('click', function() {
    localStorage.clear();
    alert("Clear All restaurant");
    document.querySelector("#favorite-list").innerHTML = " ";
    document.querySelector("#search-input").value = "";
    initMap();
    location.reload();
});



// display and roll the wheel
document.querySelector("#draw").addEventListener('click', function() {
    const restaurantList = JSON.parse(localStorage.getItem('restaurantList')) || [];
    if(restaurantList.length === 0) {
        alert("Choose some restaurant first!");
    } else {
        wheel.startAnimation();
    }
});
