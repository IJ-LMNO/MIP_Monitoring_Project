import { useState, useRef, useEffect, useMemo } from "react";
import MiniLineChart_for_detail from "../../../components/common/MinLineChart_for_detail/MiniLineChart_for_detail"
import GpsPannel from "../../../components/panels/GpsMapPannel/GpsMapPannel_for_detail"

import "./PowerStatusDetailPage.css"

function PowerStatusDetailPage(){

    const [can0, setCan0] = useState({
        history: {
            current_right: [],
            current_left: [],
            avg_power: [],
        },
    });

    const [gps, setGps] = useState({
        "latest": {
            "latitude": 0.0,
            "longitude": 0.0
        },
    
        "history" : [],
        "timestamp" : null
    });

    const [error, setError] = useState(null);
    
    const[idx, setIdx] = useState({
        "type" : null,
        "idx" : null
    }) // 마우스 올리면 현재 마우스의 좌표에 대응하는 그래프 인덱스

    const first_telemetry = useRef(false)
    const [type, setType] = useState("None")
    const[can0FirstLast, setCan0FirstLast] = useState({
        "first_timestamp" : null,
        "last_timestamp" : null
    }) // 마우스를 올린 좌표에 해당하는 인덱스가 그래프에서 어떤 시간 사이에 존재하는지에 대한 state

    function returnValue(){
        if(idx.type === "blue"){
            if(idx.idx < 0 || idx.idx >= can0.history.current_left.length){
                return null
            }
            else{
                return(
                    
                    can0.history.current_left[idx.idx][0]
                    
                )
            }
        }
        else if (idx.type === "red") {
            if (idx.idx < 0 || idx.idx >= can0.history.current_right.length) {
                return null
            }
            else {
                return (
                    
                    can0.history.current_right[idx.idx][0]
                    
                )
            }
        }
        else if (idx.type === "green") {
            if (idx.idx < 0 || idx.idx >= can0.history.avg_power.length) {
                return null
            }
            else {
                return (
                    
                        can0.history.avg_power[idx.idx][0]
                    
                )
            }
        }
    }


    useEffect(() => {
        let timer = null 
    
        const start_telemetry = async () => {
            let current_right_arr = []
            let current_left_arr = []
            let avg_power_arr = []
            let gps_arr = []

            if (!first_telemetry.current) {
                console.log("첫번째 로직 시작")
                try {
                    const response_can0 = await fetch(
                        "http://localhost:8000/first/detail/can0"
                    )

                    const response_gps = await fetch(
                        "http://localhost:8000/first/detail/gps"
                    )

                    const can0 = await response_can0.json()
                    const gps = await response_gps.json()


                    for(let i = 0; i < can0.length; i++){
                        current_right_arr.push([can0[i]["latest"]["current_right"], can0[i]["timestamp"]])
                        current_left_arr.push([can0[i]["latest"]["current_left"], can0[i]["timestamp"]])
                        avg_power_arr.push([Math.round((can0[i]["latest"]["avg_power"] / 1000) * 10) / 10, can0[i]["timestamp"]])
                    }

                    for(let i =0; i < gps.length; i++){
                        gps_arr.push(gps[i])
                    }

                    if(response_can0.ok && response_gps.ok){
                        setCan0(() => {
                            return {
                                history : {
                                    current_left : current_left_arr,
                                    current_right : current_right_arr,
                                    avg_power : avg_power_arr
                                    
                                }
                            }
                        })

                        setGps((prev)=>{
                            return{
                                ...prev,
                                history : gps_arr
                            }
                        })

                        setType("arr")
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
                const ws_can0 = new WebSocket("ws://localhost:8000/detail/can0")
                const ws_gps = new WebSocket("ws://localhost:8000/detail/gps")

                ws_can0.onopen = () =>{
                    console.log("can0 detail websocket 연결됨")
                }
                ws_gps.onopen = () => {
                    console.log("gps detail websocket 연결됨")
                }



                ws_can0.onmessage = ((event) => {
                    const data = JSON.parse(event.data)

                    setCan0((prev) => {
                        return{
                            history: {
                                current_right: [
                                    ...prev.history.current_right,
                                    [data["latest"]["current_right"], data["timestamp"]]
                                ].slice(-6000),

                                current_left: [
                                    ...prev.history.current_left,
                                    [data["latest"]["current_left"], data["timestamp"]]
                                ].slice(-6000),

                                avg_power: [
                                    ...prev.history.avg_power,
                                    [Math.round((data["latest"]["avg_power"] / 1000) * 10) / 10, data["timestamp"]]
                                ].slice(-6000),
                            },

                        }
                    })
                })

                ws_gps.onmessage = ((event) => {
                    const data = JSON.parse(event.data)
                    setGps((prev) => {
                        return({
                            ...prev,
                            latest : data["latest"],
                            timestamp : data["timestamp"]
                        })
                    })

                    setType("latest")
                })

                ws_can0.onclose = (event) => {
                        console.log(
                            "websocket 종료",
                            event.code,
                            event.reason,
                            event.wasClean
                        )
                }
                ws_gps.onclose = (event) => {
                    console.log(
                        "websocket 종료",
                        event.code,
                        event.reason,
                        event.wasClean
                    )
                }
            }

        }

        start_telemetry()

        return(() => {
            clearInterval(timer)
        })

    },[])


    return(
        <div className="powerstatus-detail-page">
            <div className="powerstatus-detail-page-chart">
                <div className="powerstatus-detail-page-chart-current-l">
                    <MiniLineChart_for_detail
                        data={can0["history"]["current_left"]}
                        color="blue"
                        min={0}
                        max={100}
                        setIdx={setIdx}
                        setCan0FirstLast={setCan0FirstLast}
                    />
                </div>
                <div className="powerstatus-detail-page-chart-current-r">
                    <MiniLineChart_for_detail
                        data={can0["history"]["current_right"]}
                        color="red"
                        min={0}
                        max={100}
                        setIdx={setIdx}
                        setCan0FirstLast={setCan0FirstLast}
                    />
                </div>
                <div className="powerstatus-detail-page-chart-avg-power">
                    <MiniLineChart_for_detail
                        data={can0["history"]["avg_power"]}
                        color="green"
                        min={0}
                        max={15}
                        setIdx={setIdx}
                        setCan0FirstLast={setCan0FirstLast}
                    />
                </div>
            </div>

            <div className="powerstatus-detail-page-gps-and-value">
                <div className="powerstatus-detail-page-gps">
                    <GpsPannel gps={gps} type={type} can0FirstLast={can0FirstLast} />
                </div>
                <div className="powerstatus-detail-page-value">
                    {returnValue()}
                </div>

            </div>
        </div>
        


    )
}

export default PowerStatusDetailPage


