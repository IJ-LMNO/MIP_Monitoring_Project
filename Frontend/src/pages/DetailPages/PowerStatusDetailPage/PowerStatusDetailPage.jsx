import { useState, useRef, useEffect, useMemo } from "react";
import MiniLineChart_for_detail from "../../../components/common/MinLineChart_for_detail/MiniLineChart_for_detail"
import GpsPannel from "../../../components/pannels/GpsMapPannel/GpsMapPannel_for_detail"

import "./PowerStatusDetailPage.css"

function PowerStatusDetailPage(){


    //--------------------------------------------------------------------------------------
    // can0
    //--------------------------------------------------------------------------------------- 
    const [can0, setCan0] = useState({
        history: {
            current_right: [],
            current_left: [],
            avg_power: [],
        },
    });


    //--------------------------------------------------------------------------------------
    // gps
    //--------------------------------------------------------------------------------------- 
    const [gps, setGps] = useState({
        "gps" : [],
        "timstamp" : null
    });

    


    //--------------------------------------------------------------------------------------
    // 차트위에 마우스를 올리면 해당 좌표에 해당하는 상태를 저장하는 state
    //  -> type : red , blue, green (차트의 색으로 차트를 구분)
    //  -> idx : 특정 차트의 마우스 좌표에 매핑되는 인덱스
    //--------------------------------------------------------------------------------------- 
    const[mouseoveridx, setMouseoveridx] = useState({
        "type" : null,
        "idx" : null
    })




    //--------------------------------------------------------------------------------------
    // 특정 차트위에 마우스를 올리면 해당 마우스 좌표에 해당하는 인덱스가 어떤 시간 사이에 존재하는지를 저장하는 state
    // 차트위에 마우스를 올림 -> 인덱스 반환 -> 인덱스에 해당하는 데이터가 사이에 존재하는 두 timestamp 반환(해당 데이터 저장)
    // -> gps pannel와 state 공유 -> gps 패널에서 두 timestamp 사이에 있는 데이터를 선으로 이음
    //  -> first_timestamp : 특정 데이터가 사이에 존재하는 두 시간 축 중 앞선 timestamp
    //  -> last_timestamp : 특정 데이터가 사이에 존재하는 두 시간 축 중 뒤에 있는 timestamp
    //--------------------------------------------------------------------------------------- 
    const[mouseovertimestamp, setMouseovertimestamp] = useState({
        "first_timestamp" : null,
        "last_timestamp" : null
    })




    //--------------------------------------------------------------------------------------
    // detail페이지는 최초에는 http 이후에는 ws로 백과 통신하기 때문에 어떤 연결을 유지해야하는지 저장하는 Ref
    //  -> false : http연결(최초 연결)
    //  -> true : ws연결(최초 연결 성공 후 데이터 하나씩 받기위한 연결)
    //--------------------------------------------------------------------------------------- 
    const first_telemetry = useRef(false)
    

    //--------------------------------------------------------------------------------------
    // error
    //--------------------------------------------------------------------------------------- 
    const [err, setError] = useState(null)






    //--------------------------------------------------------------------------------------
    // const[idx, setIdx] = useState에 따른 데이터를 화면에 표시하기 위한 함수
    //--------------------------------------------------------------------------------------- 
    function returnValue(){
        if (mouseoveridx.type === "blue"){
            if (mouseoveridx.idx < 0 || mouseoveridx.idx >= can0.history.current_left.length){
                return null
            }
            else{
                return(
                    <>
                        <div className="powerstatus-detail-page-value-type" style={{ color: mouseoveridx.type }}>
                            CurrentL
                        </div>
                        <div className="powerstatus-detail-page-value-value">
                            {can0.history.current_left[mouseoveridx.idx][0]}
                        </div>
                    </>   
                )
            }
        }
        else if (mouseoveridx.type === "red") {
            if (mouseoveridx.idx < 0 || mouseoveridx.idx >= can0.history.current_right.length) {
                return null
            }
            else {
                return (
                    <>
                        <div className="powerstatus-detail-page-value-type" style={{ color: mouseoveridx.type }}>
                            CurrentR
                        </div>
                        <div className="powerstatus-detail-page-value-value">
                            {can0.history.current_right[mouseoveridx.idx][0]}
                        </div>
                    </>  
                    
                )
            }
        }
        else if (mouseoveridx.type === "green") {
            if (mouseoveridx.idx < 0 || mouseoveridx.idx >= can0.history.avg_power.length) {
                return null
            }
            else {
                return (
                    
                    <>
                        <div className="powerstatus-detail-page-value-type" style={{ color: mouseoveridx.type }}>
                            Avg_power
                        </div>
                        <div className="powerstatus-detail-page-value-value">
                            {can0.history.avg_power[mouseoveridx.idx][0]}
                        </div>
                    </>   
                    
                )
            }
        }
    }





    useEffect(() => {
        let timer = null;
        let ws_can0 = null;
        let ws_gps = null;

        const telemetry = async () => {
            let current_right_arr = [];
            let current_left_arr = [];
            let avg_power_arr = [];
            let gps_arr = [];

            if (!first_telemetry.current) {
                console.log("첫번째 로직 시작");

                try {
                    const response_can0 = await fetch(
                        "http://localhost:8000/first/detail/can0"
                    );

                    const response_gps = await fetch(
                        "http://localhost:8000/first/detail/gps/powerstatus"
                    );

                    const can0 = await response_can0.json();
                    const gps = await response_gps.json();

                    for (let i = 0; i < can0.length; i++) {
                        current_right_arr.push([
                            can0[i]["latest"]["current_right"],
                            can0[i]["timestamp"]
                        ]);

                        current_left_arr.push([
                            can0[i]["latest"]["current_left"],
                            can0[i]["timestamp"]
                        ]);

                        avg_power_arr.push([
                            Math.round(
                                (can0[i]["latest"]["avg_power"] / 1000) * 10
                            ) / 10,
                            can0[i]["timestamp"]
                        ]);
                    }

                    for (let i = 0; i < gps.length; i++) {
                        gps_arr.push(gps[i]);
                    }



                    if(current_left_arr.length > 6000){
                        current_left_arr = current_left_arr.slice(-6000)
                    }
                    if (current_right_arr.length > 6000) {
                        current_right_arr = current_right_arr.slice(-6000)
                    }
                    if (avg_power_arr.length > 6000) {
                        avg_power_arr = avg_power_arr.slice(-6000)
                    }
                    if(gps_arr.length > 120){
                        gps_arr = gps_arr.slice(-120)
                    }




                    if (response_can0.ok && response_gps.ok) {
                        setCan0(() => {
                            return {
                                history: {
                                    current_left: current_left_arr,
                                    current_right: current_right_arr,
                                    avg_power: avg_power_arr
                                }
                            };
                        });

                        setGps(() => {
                            return {
                                gps: gps_arr
                            };
                        });

                        first_telemetry.current = true;

                        telemetry();
                    } else {
                        timer = setTimeout(telemetry, 100);
                    }
                } catch (err) {
                    setError(err);
                    timer = setTimeout(telemetry, 100);
                }
            } else {
                console.log("두번째 로직 시작");

                ws_can0 = new WebSocket(
                    "ws://localhost:8000/detail/can0"
                );

                ws_gps = new WebSocket(
                    "ws://localhost:8000/detail/gps/powerstatus"
                );

                ws_can0.onopen = () => {
                    console.log("can0 detail websocket 연결됨");
                };

                ws_gps.onopen = () => {
                    console.log("gps detail websocket 연결됨");
                };

                ws_can0.onmessage = (event) => {
                    const data = JSON.parse(event.data);

                    setCan0((prev) => {
                        return {
                            history: {
                                current_right: [
                                    ...prev.history.current_right,
                                    [
                                        data["latest"]["current_right"],
                                        data["timestamp"]
                                    ]
                                ].slice(-6000),

                                current_left: [
                                    ...prev.history.current_left,
                                    [
                                        data["latest"]["current_left"],
                                        data["timestamp"]
                                    ]
                                ].slice(-6000),

                                avg_power: [
                                    ...prev.history.avg_power,
                                    [
                                        Math.round(
                                            (
                                                data["latest"]["avg_power"] /
                                                1000
                                            ) * 10
                                        ) / 10,
                                        data["timestamp"]
                                    ]
                                ].slice(-6000)
                            }
                        };
                    });
                };

                ws_gps.onmessage = (event) => {
                    const data = JSON.parse(event.data);

                    setGps((prev) => {
                        return {
                            gps: [
                                ...prev.gps,
                                data
                            ].slice(-6000)
                        };
                    });
                };

                ws_can0.onclose = (event) => {
                    console.log(
                        "can0 websocket 종료",
                        event.code,
                        event.reason,
                        event.wasClean
                    );
                };

                ws_gps.onclose = (event) => {
                    console.log(
                        "gps websocket 종료",
                        event.code,
                        event.reason,
                        event.wasClean
                    );
                };
            }
        };

        telemetry();

        return () => {
            if (timer !== null) {
                clearTimeout(timer);
            }

            if (ws_can0 !== null) {
                ws_can0.close();
            }

            if (ws_gps !== null) {
                ws_gps.close();
            }

            console.log("PowerStatusDetailPage cleanup");
        };
    }, []);


    return(
        <div className="powerstatus-detail-page">
            <div className="powerstatus-detail-page-chart">
                <div className="powerstatus-detail-page-chart-current-l">
                    <MiniLineChart_for_detail
                        data={can0["history"]["current_left"]}
                        color="blue"
                        min={0}
                        max={100}
                        setMouseoveridx={setMouseoveridx}
                        setMouseovertimestamp={setMouseovertimestamp}
                    />
                </div>
                <div className="powerstatus-detail-page-chart-current-r">
                    <MiniLineChart_for_detail
                        data={can0["history"]["current_right"]}
                        color="red"
                        min={0}
                        max={100}
                        setMouseoveridx={setMouseoveridx}
                        setMouseovertimestamp={setMouseovertimestamp}
                    />
                </div>
                <div className="powerstatus-detail-page-chart-avg-power">
                    <MiniLineChart_for_detail
                        data={can0["history"]["avg_power"]}
                        color="green"
                        min={0}
                        max={15}
                        setMouseoveridx={setMouseoveridx}
                        setMouseovertimestamp={setMouseovertimestamp}
                    />
                </div>
            </div>

            <div className="powerstatus-detail-page-gps-and-value">
                <div className="powerstatus-detail-page-gps">
                    <GpsPannel 
                        gps={gps.gps} 
                        mouseovertimestamp={mouseovertimestamp} />
                        slicevalue = {6000}
                </div>          

                <div className="powerstatus-detail-page-value">
                    {returnValue()}
                </div>

            </div>
        </div>
        


    )
}

export default PowerStatusDetailPage


