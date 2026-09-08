import { useEffect, useRef, useState } from "react";

import {
    MapContainer,
    Polyline,
    CircleMarker,
    useMap
} from "react-leaflet";

import L from "leaflet";

import {
    setWorkerUrl
} from "maplibre-gl";

import workerUrl from
    "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";

import "@maplibre/maplibre-gl-leaflet";

import "./GpsMapPannel.css";


setWorkerUrl(workerUrl);


const INITIAL_POSITION = [
    37.5665,
    126.978
];


// function OpenFreeMapLayer() {
//     const map = useMap();

//     useEffect(() => {
//         const layer = L.maplibreGL({
//             style:
//                 "https://tiles.openfreemap.org/styles/dark",
//             interactive: false
//         });

//         layer.addTo(map);


//         requestAnimationFrame(() => {
//             map.invalidateSize();
//         });


//         return () => {
//             map.removeLayer(layer);
//         };

//     }, [map]);


//     return null;
// }


// function MoveMapCenter({ position }) {
//     const map = useMap();

//     useEffect(() => {
//         if (!position) {
//             return;
//         }

//         map.panTo(position);

//     }, [map, position]);


//     return null;
// }


function GpsMapPannel({ gps }) {
    const [route, setRoute] = useState([]);


    useEffect(() => {
        if (!gps || !gps.latest) {
            return;
        }


        const latitude =
            Number(
                gps.latest.latitude
            );

        const longitude =
            Number(
                gps.latest.longitude
            );


        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {
            return;
        }


        if (
            latitude === 0 &&
            longitude === 0
        ) {
            return;
        }


        const nextPosition = [
            latitude,
            longitude
        ];


        setRoute((prev) => {
            const previousPosition =
                prev[prev.length - 1];


            if (
                previousPosition &&
                previousPosition[0]
                === latitude &&
                previousPosition[1]
                === longitude
            ) {
                return prev;
            }


            return [
                ...prev,
                nextPosition
            ];
        });

    }, [gps]);


    const currentPosition =
        route.length > 0
            ? route[route.length - 1]
            : INITIAL_POSITION;


    return (
        <div className="gps-map-pannel">

            <MapContainer
                center={INITIAL_POSITION}
                zoom={17}
                minZoom={1}
                style={{
                    width: "100%",
                    height: "100%"
                }}
            >

                {/* <OpenFreeMapLayer /> */}


                {route.length > 1 && (
                    <Polyline
                        positions={route}
                    />
                )}


                {route.length > 0 && (
                    <CircleMarker
                        center={
                            currentPosition
                        }
                        radius={7}
                    />
                )}

{/* 
                {route.length > 0 && (
                    <MoveMapCenter
                        position={
                            currentPosition
                        }
                    />
                )} */}

            </MapContainer>

        </div>
    );
}


export default GpsMapPannel;