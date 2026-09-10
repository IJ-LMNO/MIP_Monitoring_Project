import { useEffect, useRef, useState } from "react";

//--------------------------------------------------------------------------------------
// Gps 랜더링을 위한 import
//--------------------------------------------------------------------------------------- 
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


//--------------------------------------------------------------------------------------
// Gps 데이터의 최초 설정 값
//--------------------------------------------------------------------------------------- 
const INITIAL_POSITION = [
    37.5665,
    126.978
];


//--------------------------------------------------------------------------------------
// Gps가 들어온 이전 시간을 저장
// Gps 데이터는 1초마다 한 번씩 들어오기 때문에 이전 timestamp를 기록해, timestamp가 변화했는지 파악
//--------------------------------------------------------------------------------------- 
let prevTimestamp = null


//--------------------------------------------------------------------------------------
// Gps Map 랜더링 관련 함수들
//--------------------------------------------------------------------------------------- 
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



//--------------------------------------------------------------------------------------
// Gps Paneel : export default GpsMapPannel
//--------------------------------------------------------------------------------------- 
function GpsMapPannel({ 
        gps, // gps {"latest" : latitude, longtitude, hitory : []}
        mouseovertimestamp, // {first_timestamp, last_timestamp}
        slicevalue
    }) {

    //--------------------------------------------------------------------------------------
    // Gps 데이터가 들어온 timestamp를 임시보관
    //--------------------------------------------------------------------------------------- 
    const tmptimestamp = []; 


    ///--------------------------------------------------------------------------------------
    //  Gps Map에 표시하기위해 gps 데이터를 저장하는 state
    //--------------------------------------------------------------------------------------- 
    const [route, setRoute] = useState([]);


    ///--------------------------------------------------------------------------------------
    // 차트에 마우스를 올렸을 때 선택된 인덱스 데이터의 timestamp가 포함된 gps 데이터 인덱스 저장하는 state
    // selectedRoute = [firstIndex(특정 timestamp를 가진 차트 데이터가 존재하는 gps데이터의 첫번째 인덱스), lastIndex(특정 timestamp를 가진 차트 데이터가 존재하는 gps데이터의 마지막 인덱스)]
    //--------------------------------------------------------------------------------------- 
    const [selectedRoute, setSelectedRoute] = useState([]);


    //--------------------------------------------------------------------------------------
    // Gps 데이터가 들어온 timestamp를 보관
    //--------------------------------------------------------------------------------------- 
    let timestampindex = useRef([]); 


    
    useEffect(() => {

        let history_arr = [];

        for (let index = 0; index < gps.length; index++) {
            history_arr.push([
                gps[index]["latest"]["latitude"],
                gps[index]["latest"]["longitude"]
            ]);

            if (
                prevTimestamp !=
                gps[index]["timestamp"]
                    .split("T")[1]
                    .split(".")[0]
            ) {
                timestampindex.current.push([
                    index,
                    gps[index]["timestamp"]
                        .split("T")[1]
                        .split(".")[0]
                ]);

                if (timestampindex.current.length > slicevalue) {
                    timestampindex.current = timestampindex.current.slice(-slicevalue);
                }

                prevTimestamp =
                    gps[index]["timestamp"]
                        .split("T")[1]
                        .split(".")[0];
            }
        }

        setRoute(history_arr);

    }, [gps]);


    ///--------------------------------------------------------------------------------------
    //  Can0의 first_timestmap ~ last_timestamp 사이에 해당하는 Gps 좌표를 찾아 selectedRoute에 제공
    //  -> useEffect를 사용함으로써, 메인 렌더링과 별개의 사이드 이펙트를 만들 수 있음
    //  -> mouseovertimestamp = {first_timestamp, last_timestamp}
    //--------------------------------------------------------------------------------------- 
    useEffect(() => {
        if (
            mouseovertimestamp == null ||
            mouseovertimestamp.first_timestamp == null ||
            mouseovertimestamp.last_timestamp == null
        ) {
            setSelectedRoute([]);
            return;
        }


        let firstTimestamp =
            mouseovertimestamp.first_timestamp;

        let lastTimestamp =
            mouseovertimestamp.last_timestamp;


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

        


        ///--------------------------------------------------------------------------------------
        //  selectedRoute에 저장할 Can0 데이터의 timestamp를 포함하는 gps 데이터 인덱스 추출
        //--------------------------------------------------------------------------------------- 
        let firstIndex = null;
        let lastIndex = null;


        for (
            let i = 0;
            i < timestampindex.current.length;
            i++
        ) {
            if (
                timestampindex.current[i][1] >= firstTimestamp
            ) {
                firstIndex =
                    timestampindex.currnet[i][0];

                break;
            }

        }

        for (
            let i = timestampindex.current.length - 1;
            i >= 0;
            i--
        ) {
            if (
                timestampindex.current[i][1] <= lastTimestamp
            ) {
                lastIndex =
                    timestampindex.current[i][0];

                break;
            }
        }



        if (
            firstIndex == null ||
            lastIndex == null ||
            firstIndex > lastIndex
        ) {
            return;
        }

        const selectedGpsHistory =
            gps.slice(firstIndex, lastIndex + 1);

        const selectedCoordinates =
            selectedGpsHistory.map((value) => [
                value["latest"]["latitude"],
                value["latest"]["longitude"]
            ]);
        

        setSelectedRoute(selectedCoordinates);


    }, [mouseovertimestamp]);


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


                {
                    <MoveMapCenter
                        position={
                            currentPosition
                        }
                    />
                }


            </MapContainer>

        </div>
    );
}


export default GpsMapPannel;