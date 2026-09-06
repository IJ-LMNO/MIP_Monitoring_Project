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


const timestampindex = []; //gps가 들어온 timestamp보관
let lastIndexGpsHistory = null


// 추가: GPS 전체 index와 좌표를 대응해서 보관
const gpsCoordinateIndex = [];


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


function GpsMapPannel({ gps, type, can0FirstLast }) {
    const [route, setRoute] = useState([]);


    // 추가: 선택된 GPS 구간
    const [selectedRoute, setSelectedRoute] = useState([]);


    useEffect(() => {

        if(type === "arr"){
            const history_arr = []
            let prevTimestamp = null

            for(let i=0; i < gps.history.length; i++){
                history_arr.push([
                    gps["history"][i]["latest"]["latitude"],
                    gps["history"][i]["latest"]["longitude"]
                ].slice(-1200))


                // 추가: GPS index와 좌표 저장
                gpsCoordinateIndex[i] = [
                    gps["history"][i]["latest"]["latitude"],
                    gps["history"][i]["latest"]["longitude"]
                ];


                if (
                    prevTimestamp !=
                    gps["history"][i]["timestamp"]
                        .split("T")[1]
                        .split(".")[0]
                ){
                    timestampindex.push([
                        i,
                        gps["history"][i]["timestamp"]
                            .split("T")[1]
                            .split(".")[0]
                    ])
                
                    prevTimestamp =
                        gps["history"][i]["timestamp"]
                            .split("T")[1]
                            .split(".")[0]
                }
            }

            setRoute(history_arr)
            lastIndexGpsHistory = gps.history.length
        }

        else if(type === "latest"){
            let prevTimestamp = null
            const data = gps["latest"]

            console.log(data)

            const latitude =
                Number(
                    data.latitude
                );

            const longitude =
                Number(
                    data.longitude
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
                ].slice(-1200);
            });


            // 추가: latest GPS 좌표도 동일한 index 기준으로 저장
            gpsCoordinateIndex[lastIndexGpsHistory] = [
                latitude,
                longitude
            ];


            if (
                prevTimestamp !=
                gps["timestamp"]
                    .split("T")[1]
                    .split(".")[0]
            ) {
                timestampindex.push([
                    lastIndexGpsHistory,
                    gps["timestamp"]
                        .split("T")[1]
                        .split(".")[0]
                ])

                prevTimestamp =
                    gps["timestamp"]
                        .split("T")[1]
                        .split(".")[0]
            }

            lastIndexGpsHistory = lastIndexGpsHistory +1
        }

        else{
            return
        }

    }, [gps,type]);


    // 추가:
    // CAN0 first_timestamp ~ last_timestamp 사이에 해당하는
    // GPS 좌표들을 찾아 selectedRoute에 저장
    useEffect(() => {

        if (
            can0FirstLast == null ||
            can0FirstLast.first_timestamp == null ||
            can0FirstLast.last_timestamp == null
        ) {
            setSelectedRoute([]);
            return;
        }


        let firstTimestamp =
            can0FirstLast.first_timestamp;

        let lastTimestamp =
            can0FirstLast.last_timestamp;


        // ISO timestamp가 들어오는 경우 HH:MM:SS만 추출
        if (firstTimestamp.includes("T")) {
            firstTimestamp =
                firstTimestamp
                    .split("T")[1]
                    .split(".")[0];
        }


        if (lastTimestamp.includes("T")) {
            lastTimestamp =
                lastTimestamp
                    .split("T")[1]
                    .split(".")[0];
        }


        let firstIndex = null;
        let lastIndex = null;


        // firstTimestamp 이상이 되는 최초 GPS index
        for (
            let i = 0;
            i < timestampindex.length;
            i++
        ) {
            if (
                timestampindex[i][1] >= firstTimestamp
            ) {
                firstIndex =
                    timestampindex[i][0];

                break;
            }
        }


        // lastTimestamp 이하인 마지막 GPS index
        for (
            let i = timestampindex.length - 1;
            i >= 0;
            i--
        ) {
            if (
                timestampindex[i][1] <= lastTimestamp
            ) {
                lastIndex =
                    timestampindex[i][0];

                break;
            }
        }


        if (
            firstIndex == null ||
            lastIndex == null ||
            firstIndex > lastIndex
        ) {
            setSelectedRoute([]);
            return;
        }


        const selectedGpsCoordinates = [];


        for (
            let i = firstIndex;
            i <= lastIndex;
            i++
        ) {
            if (
                gpsCoordinateIndex[i] != null
            ) {
                selectedGpsCoordinates.push(
                    gpsCoordinateIndex[i]
                );
            }
        }


        setSelectedRoute(
            selectedGpsCoordinates.slice(-1200)
        );

    }, [can0FirstLast]);


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


                {route.length > 1 && (
                    <Polyline
                        positions={route}
                    />
                )}


                {/* 추가: 선택된 시간 범위의 GPS 경로 */}
                {selectedRoute.length > 1 && (
                    <Polyline
                        positions={selectedRoute}
                        pathOptions={{
                            color: "red",
                            weight: 5
                        }}
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


                {route.length > 0 && (
                    <MoveMapCenter
                        position={
                            currentPosition
                        }
                    />
                )}


            </MapContainer>

        </div>
    );
}


export default GpsMapPannel;