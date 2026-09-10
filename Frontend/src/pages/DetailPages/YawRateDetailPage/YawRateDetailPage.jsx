import { useState, useRef, useEffect, useMemo } from "react";
import TwoMiniLineChart_for_detail from "../../../components/common/TwoMiniLineChart_for_detail/TwoMiniLineChart_for_detail"
import GpsPannel from "../../../components/pannels/GpsMapPannel/GpsMapPannel_for_detail"

import "./YawRateDetailPage.css"

function YawRateDetailPage(){


    //--------------------------------------------------------------------------------------
    // yawrate
    //--------------------------------------------------------------------------------------- 
    const [yawrate, setYawrate] = useState({
        history: [],
    });



    //--------------------------------------------------------------------------------------
    // desired_yawrate
    //--------------------------------------------------------------------------------------- 
    const [desiredYawrate, setDesiredYawrate] = useState({
        history: [],
    });


    //--------------------------------------------------------------------------------------
    // gps
    //--------------------------------------------------------------------------------------- 
    const [gps, setGps] = useState({
        "gps": [],
        "timstamp": null
    });




    //--------------------------------------------------------------------------------------
    // 차트위에 마우스를 올리면 해당 좌표에 해당하는 상태를 저장하는 state
    //  -> type : red , blue, green (차트의 색으로 차트를 구분)
    //  -> idx : 특정 차트의 마우스 좌표에 매핑되는 인덱스
    //--------------------------------------------------------------------------------------- 
    const [mouseoveridx, setMouseoveridx] = useState({
        "idx": null
    })




    //--------------------------------------------------------------------------------------
    // 특정 차트위에 마우스를 올리면 해당 마우스 좌표에 해당하는 인덱스가 어떤 시간 사이에 존재하는지를 저장하는 state
    // 차트위에 마우스를 올림 -> 인덱스 반환 -> 인덱스에 해당하는 데이터가 사이에 존재하는 두 timestamp 반환(해당 데이터 저장)
    // -> gps pannel와 state 공유 -> gps 패널에서 두 timestamp 사이에 있는 데이터를 선으로 이음
    //  -> first_timestamp : 특정 데이터가 사이에 존재하는 두 시간 축 중 앞선 timestamp
    //  -> last_timestamp : 특정 데이터가 사이에 존재하는 두 시간 축 중 뒤에 있는 timestamp
    //--------------------------------------------------------------------------------------- 
    const [mouseovertimestamp, setMouseovertimestamp] = useState({
        "first_timestamp": null,
        "last_timestamp": null
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
    // yawrate, desired_yawrate state slice 개수
    //--------------------------------------------------------------------------------------- 
    const yawrateSliceValue = 2400


    //--------------------------------------------------------------------------------------
    // const[idx, setIdx] = useState에 따른 데이터를 화면에 표시하기 위한 함수
    //--------------------------------------------------------------------------------------- 
    function returnValue() {
        const len = Math.min(yawrate["history"].length, desiredYawrate["history"].length)

        if(mouseoveridx.idx == null)
            return null

        if (mouseoveridx.idx < 0 || mouseoveridx.idx >= len) {
            return null
        }
        else {
            return (
                <>
                    <div className="powerstatus-detail-page-value-type" style={{ color: mouseoveridx.type }}>
                        yawrate / Desired-yawrate
                    </div>
                    <div className="powerstatus-detail-page-value-value">
                        {yawrate["history"][mouseoveridx.idx][0]}
                        {desiredYawrate["history"][mouseoveridx.idx][0]}
                    </div>
                </>
            )
        }
    }

    useEffect(() => {
        let timer = null 
        let ws = null
        let ws_gps = null
    
        const start_telemetry = async () => {
            let yawrate_arr = []
            let desired_yawrate_arr = []
            let gps_arr = []
            let len = null

            if (!first_telemetry.current) {
                console.log("첫번째 로직 시작")
                try {
                    const response_yawrate = await fetch(
                        "http://localhost:8000/first/detail/yawrate"
                    )

                    const response_gps = await fetch(
                        "http://localhost:8000/first/detail/gps/yawrate"
                    );

                    const data = await response_yawrate.json()
                    const gps = await response_gps.json()


       
                    len = Math.min(data["yawrate"].length, data["desired_yawrate"].length)
                    for (let i = 0; i < len; i++) {
                        yawrate_arr.push([data["yawrate"][i]["yawrate"], data["yawrate"][i]["timestamp"]])
                        desired_yawrate_arr.push([data["desired_yawrate"][i]["desired_yawrate"], data["desired_yawrate"][i]["timestamp"]])
                    }

                    for (let i = 0; i < gps.length; i++) {
                        gps_arr.push(gps[i]);
                    }
                   
       
                    if (yawrate_arr.length > yawrateSliceValue) {
                        yawrate_arr = yawrate_arr.slice(-yawrateSliceValue)
                    }
                    if (desired_yawrate_arr.length > yawrateSliceValue) {
                        desired_yawrate_arr = desired_yawrate_arr.slice(-yawrateSliceValue)
                    }
                    if (gps_arr.length > 120) {
                        gps_arr = gps_arr.slice(-120)
                    }


                    if (response_yawrate.ok){
                        setYawrate(() => {
                            return {
                                history: yawrate_arr
                            }
                        })

                        setDesiredYawrate(() => {
                            return {
                                history: desired_yawrate_arr
                            }
                        })

                        setGps(() => {
                            return {
                                gps: gps_arr
                            };
                        });

                        first_telemetry.current = true
                        start_telemetry()

                    }
                    else{
                        timer = setTimeout(start_telemetry, 1000)
                    }

                } catch (err) {
                    setError(err)
                    timer = setTimeout(start_telemetry, 1000)
                }
            }else{
                console.log("두번째 로직 시작")
                const ws = new WebSocket("ws://localhost:8000/detail/yawrate")
                const ws_gps = new WebSocket("ws://localhost:8000/detail/gps/yawrate");

                ws.onopen = () =>{
                    console.log("yawrate detail websocket 연결됨")
                }

                ws_gps.onopen = () => {
                    console.log("gps detail websocket 연결됨");
                };


                ws.onmessage = ((event) => {
                    const data = JSON.parse(event.data)
                    setYawrate((prev) => {
                        return{
                            history : [
                                ...prev.history,
                                [data["yawrate"]["yawrate"], data["yawrate"]["timestamp"]]
                            ].slice(-yawrateSliceValue)
                        }
                    })

                    setDesiredYawrate((prev) => {
                        return{
                            history : [
                                ...prev.history,
                                [data["desired_yawrate"]["desired_yawrate"], data["desired_yawrate"]["timestamp"]]
                            ].slice(-yawrateSliceValue)
                        }
                    })
                })

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


                ws.onclose = (event) => {
                        console.log(
                            "websocket 종료",
                            event.code,
                            event.reason,
                            event.wasClean
                        )
                }


                ws_gps.onclose = (event) => {
                    console.log(
                        "gps websocket 종료",
                        event.code,
                        event.reason,
                        event.wasClean
                    );
                };
            }

        }

        start_telemetry()

        return(() => {
            if (timer !== null) {
                clearTimeout(timer);
            }

            if (ws !== null) {
                ws_can0.close();
            }

            if (ws_gps !== null) {
                ws_gps.close();
            }
        })

    },[])


    return(
        <div className="yawrate-detail-page">
            <div className="yawrate-detail-page-chart">
                <TwoMiniLineChart_for_detail
                    yawrate={yawrate["history"]}
                    desiredyawrate={desiredYawrate["history"]}
                    setMouseoveridx={setMouseoveridx}
                    setMouseovertimestamp={setMouseovertimestamp}
                />
            </div>

            <div className="yawrate-detail-page-gps-and-value">
                <div className="yawrate-detail-page-gps">
                    <GpsPannel
                        gps={gps.gps}
                        mouseovertimestamp={mouseovertimestamp}
                        slicevalue = {6000} />
                </div>

                <div className="yawrate-detail-page-value">
                    {returnValue()}
                </div>

            </div>
            
        </div>

    )
}

export default YawRateDetailPage


