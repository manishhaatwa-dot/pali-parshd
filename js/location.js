// =========================================================
// PARSHD - LOCATION MODULE
// File: js/location.js
// =========================================================

const LocationState = {
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
    address: ""
};


// =========================================================
// GET CURRENT LOCATION
// =========================================================

export function getCurrentLocation() {

    return new Promise((resolve, reject) => {

        if (!navigator.geolocation) {

            reject(
                new Error(
                    "इस device में location सुविधा उपलब्ध नहीं है।"
                )
            );

            return;
        }


        navigator.geolocation.getCurrentPosition(

            position => {

                LocationState.latitude =
                    position.coords.latitude;

                LocationState.longitude =
                    position.coords.longitude;

                LocationState.accuracy =
                    position.coords.accuracy;

                LocationState.timestamp =
                    new Date().toISOString();


                resolve({
                    latitude:
                        LocationState.latitude,

                    longitude:
                        LocationState.longitude,

                    accuracy:
                        LocationState.accuracy,

                    timestamp:
                        LocationState.timestamp
                });

            },

            error => {

                let message =
                    "Location प्राप्त नहीं हो सकी।";


                switch (error.code) {

                    case error.PERMISSION_DENIED:

                        message =
                            "Location permission allow करें।";

                        break;


                    case error.POSITION_UNAVAILABLE:

                        message =
                            "Location अभी उपलब्ध नहीं है।";

                        break;


                    case error.TIMEOUT:

                        message =
                            "Location प्राप्त करने में समय लग रहा है।";

                        break;
                }


                reject(
                    new Error(message)
                );

            },

            {
                enableHighAccuracy: true,

                timeout: 15000,

                maximumAge: 0
            }

        );

    });

}


// =========================================================
// GET LOCATION WITHOUT BLOCKING COMPLAINT
// =========================================================

export async function captureLocation() {

    try {

        const location =
            await getCurrentLocation();

        return location;

    } catch (error) {

        console.warn(
            "Location capture failed:",
            error.message
        );

        /*
         Location complaint submission को
         automatically block नहीं करेगी.
        */

        return {
            latitude: null,
            longitude: null,
            accuracy: null,
            timestamp: null
        };

    }

}


// =========================================================
// CREATE GOOGLE MAP LINK
// =========================================================

export function getMapLink(
    latitude,
    longitude
) {

    if (
        latitude === null ||
        latitude === undefined ||
        longitude === null ||
        longitude === undefined
    ) {
        return "";
    }


    return (
        "https://www.google.com/maps/search/?api=1" +
        `&query=${encodeURIComponent(
            `${latitude},${longitude}`
        )}`
    );

}


// =========================================================
// CREATE EMBED MAP URL
// =========================================================

export function getMapEmbedLink(
    latitude,
    longitude
) {

    if (
        latitude === null ||
        latitude === undefined ||
        longitude === null ||
        longitude === undefined
    ) {
        return "";
    }


    return (
        "https://www.google.com/maps?q=" +
        `${encodeURIComponent(
            `${latitude},${longitude}`
        )}&output=embed`
    );

}


// =========================================================
// SET MANUAL ADDRESS
// =========================================================

export function setLocationAddress(
    address
) {

    LocationState.address =
        address || "";

}


// =========================================================
// GET LOCATION STATE
// =========================================================

export function getLocationData() {

    return {
        latitude:
            LocationState.latitude,

        longitude:
            LocationState.longitude,

        accuracy:
            LocationState.accuracy,

        timestamp:
            LocationState.timestamp,

        address:
            LocationState.address
    };

}


// =========================================================
// CHECK LOCATION AVAILABLE
// =========================================================

export function hasLocation() {

    return (
        LocationState.latitude !== null &&
        LocationState.longitude !== null
    );

}


// =========================================================
// CLEAR LOCATION
// =========================================================

export function clearLocation() {

    LocationState.latitude = null;

    LocationState.longitude = null;

    LocationState.accuracy = null;

    LocationState.timestamp = null;

    LocationState.address = "";

}


// =========================================================
// GLOBAL LOCATION API
// =========================================================

window.ParshdLocation = {

    getCurrentLocation,

    captureLocation,

    getMapLink,

    getMapEmbedLink,

    setLocationAddress,

    getLocationData,

    hasLocation,

    clearLocation

};