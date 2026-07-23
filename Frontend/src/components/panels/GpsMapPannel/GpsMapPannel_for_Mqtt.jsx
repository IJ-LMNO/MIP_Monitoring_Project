import { useEffect, useRef, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Polyline,
    CircleMarker,
    useMap
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "./GpsMapPannel.css";

function MoveMapCenter({ position }) {
    const map = useMap();

    useEffect(() => {
        if (!position) {
            return;
        }

        map.panTo(position);
    }, [map, position]);

    return null;
}

function GpsMap({ gps }) {
    const [route, setRoute] = useState([]);
    const gpsVersionRef = useRef(0);

    useEffect(() => {
        try {
            if (gps.version === gpsVersionRef.current) {
                return;
            }

            gpsVersionRef.current = gps.version;

            const latitude = Number(gps.latest.latitude);
            const longitude = Number(gps.latest.longitude);

            if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude)
            ) {
                return;
            }

            const nextPosition = [latitude, longitude];

            setRoute((prev) => {
                const previousPosition = prev.at(-1);

                const isSamePosition =
                    previousPosition &&
                    previousPosition[0] === latitude &&
                    previousPosition[1] === longitude;

                const isInvalidPosition =
                    latitude === 0 && longitude === 0;

                if (isSamePosition || isInvalidPosition) {
                    return prev;
                }

                return [...prev, nextPosition];
            });
        } catch (error) {
            console.error(error);
        }
    }, [gps]);

    const currentPosition = route.at(-1);

    const initialPosition = currentPosition ?? [
        37.5665,
        126.978
    ];

    return (
        <div className="gps-map-container">
            {!currentPosition && (
                <div className="gps-map-empty">
                    GPS 데이터 대기 중
                </div>
            )}

            <MapContainer
                className="gps-map"
                center={initialPosition}
                zoom={17}
            >
                <TileLayer
                    attribution="&copy; OpenStreetMap contributors &copy; CARTO"
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {route.length >= 2 && (
                    <Polyline
                        positions={route}
                        pathOptions={{
                            color: "#38bdf8",
                            weight: 4
                        }}
                    />
                )}

                {currentPosition && (
                    <>
                        <CircleMarker
                            center={currentPosition}
                            radius={7}
                            pathOptions={{
                                color: "#ffffff",
                                fillColor: "#ef4444",
                                fillOpacity: 1,
                                weight: 2
                            }}
                        />

                        <MoveMapCenter
                            position={currentPosition}
                        />
                    </>
                )}
            </MapContainer>
        </div>
    );
}

export default GpsMap;