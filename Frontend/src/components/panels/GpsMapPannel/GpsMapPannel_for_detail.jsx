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


let timestampindex = []
let index = null


function OpenFreeMapLayer() {
    const map = useMap();

    useEffect(() => {
        const layer = L.maplibreGL({
            style:
                "https://tiles.openfreemap.org/styles/dark",
            interactive: false
        });

        layer.addTo(map);


        requestAnimationFrame(() => {
            map.invalidateSize();
        });


        return () => {
            map.removeLayer(layer);
        };

    }, [map]);


    return null;
}


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


function GpsMapPannel({
    gps,
    type,
    setGpstimestamp,
    can0FirstLast
}) {
    const [route, setRoute] = useState([]);
    const [signRoute, setSignRoute] = useState([]);

    const prevTimestampRef = useRef(null);
    const indexRef = useRef(0);
    const timestampIndexRef = useRef([]);


    // GPS 데이터 처리
    useEffect(() => {

        if (type === "arr") {
            const history_arr = [];
            let prev_timestamp = null;

            timestampIndexRef.current = [];

            for (let i = 0; i < gps.history.length; i++) {

                const latitude =
                    Number(gps.history[i].latest.latitude);

                const longitude =
                    Number(gps.history[i].latest.longitude);

                history_arr.push([
                    latitude,
                    longitude
                ]);

                const timestamp =
                    gps.history[i].timestamp
                        .split("T")[1]
                        .split(".")[0];


                if (prev_timestamp !== timestamp) {

                    timestampIndexRef.current.push([
                        i,
                        timestamp
                    ]);

                    prev_timestamp = timestamp;
                }

                indexRef.current = i;
            }

            setRoute(history_arr);

            if (gps.history.length > 0) {
                const last =
                    gps.history[gps.history.length - 1];

                setGpstimestamp(
                    last.timestamp
                        .split("T")[1]
                        .split(".")[0]
                );
            }
        }


        else if (type === "latest") {

            indexRef.current += 1;

            const data = gps.latest;

            const latitude = Number(data.latitude);
            const longitude = Number(data.longitude);


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
                    previousPosition[0] === latitude &&
                    previousPosition[1] === longitude
                ) {
                    return prev;
                }

                return [
                    ...prev,
                    nextPosition
                ].slice(-120);
            });


            const timestamp =
                gps.timestamp
                    .split("T")[1]
                    .split(".")[0];


            setGpstimestamp(timestamp);


            if (
                prevTimestampRef.current !== timestamp
            ) {

                timestampIndexRef.current.push([
                    indexRef.current,
                    timestamp
                ]);

                prevTimestampRef.current =
                    timestamp;
            }
        }

    }, [gps, type]);


    // CAN 차트의 first ~ last 시간에 해당하는 GPS 구간 찾기
    useEffect(() => {

        const firstTimestamp =
            can0FirstLast.first_timestamp;

        const lastTimestamp =
            can0FirstLast.last_timestamp;


        if (
            firstTimestamp == null ||
            lastTimestamp == null
        ) {
            setSignRoute([]);
            return;
        }


        const timestamps =
            timestampIndexRef.current;


        // first 이상이 되는 최초 GPS
        const firstData =
            timestamps.find(
                ([idx, timestamp]) =>
                    timestamp >= firstTimestamp
            );


        // last 이하인 GPS 중 마지막 GPS
        const lastData =
            [...timestamps]
                .reverse()
                .find(
                    ([idx, timestamp]) =>
                        timestamp <= lastTimestamp
                );


        if (
            firstData == null ||
            lastData == null
        ) {
            setSignRoute([]);
            return;
        }


        const firstIndex = firstData[0];
        const lastIndex = lastData[0];


        if (firstIndex > lastIndex) {
            setSignRoute([]);
            return;
        }


        // arr 모드에서는 gps.history index를 그대로 이용 가능
        if (type === "arr") {

            const selectedRoute =
                gps.history
                    .slice(
                        firstIndex,
                        lastIndex + 1
                    )
                    .map((data) => [
                        Number(data.latest.latitude),
                        Number(data.latest.longitude)
                    ]);

            setSignRoute(selectedRoute);
        }

    }, [can0FirstLast, gps, type]);


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

                <OpenFreeMapLayer />


                {/* 기존 GPS 주행 경로 */}
                {route.length > 1 && (
                    <Polyline
                        positions={route}
                    />
                )}


                {/* 차트에서 선택한 시간 범위 */}
                {signRoute.length > 1 && (
                    <Polyline
                        positions={signRoute}
                        pathOptions={{
                            color: "red",
                            weight: 6
                        }}
                    />
                )}


                {route.length > 0 && (
                    <CircleMarker
                        center={currentPosition}
                        radius={7}
                    />
                )}


                {route.length > 0 && (
                    <MoveMapCenter
                        position={currentPosition}
                    />
                )}

            </MapContainer>

        </div>
    );
}


export default GpsMapPannel;