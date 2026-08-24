import { useState, useRef, useEffect, useMemo } from "react";
import MiniLineChart_for_detail from "../../../components/common/MinLineChart_for_detail/MiniLineChart_for_detail"

import "./PowerStatusDetailPage.css"

function PowerStatusDetailPage(){

    const [can0, setCan0] = useState({
        latest: {
            avg_rpm: 0.0,
            avg_voltage: 0.0,
            avg_power: 0.0,

            power_right: 0.0,
            power_left: 0.0,

            speed: 0.0,

            current_left: 0.0,
            current_right: 0.0,

            rpm_left: 0.0,
            rpm_right: 0.0,

            torque_left: 0.0,
            torque_right: 0.0,
        },

        history: {
            current_right: [],
            current_left: [],
            avg_power: [],
        },

        version: 0,
    });

    const [error, setError] = useState(null);

    const first_telemetry = useRef(false)


    useEffect(() => {
        let timer = null 
    
        const start_telemetry = async () => {
            let current_right_arr = []
            let current_left_arr = []
            let avg_power_arr = []

            if (!first_telemetry.current) {
                console.log("첫번째 로직 시작")
                try {
                    const response_can1 = await fetch(
                        "http://localhost:8000/first/detail/can0"
                    )

                    const can0 = await response_can1.json()


                    for(let i = 0; i < can0.length; i++){
                        current_right_arr.push(can0[i]["latest"]["current_right"])
                        current_left_arr.push(can0[i]["latest"]["current_left"])
                        avg_power_arr.push(can0[i]["latest"]["avg_power"])
                    }

                    if(response_can1.ok){
                        setCan0((prev) => {
                            return {
                                ...prev,
                                history : {
                                    current_left : current_left_arr,
                                    current_right : current_right_arr,
                                    avg_power : avg_power_arr
                                    
                                }
                            }
                        })

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
                let ws = new WebSocket("ws://localhost:8000/detail/can0")

                ws.onopen = () =>{
                    console.log("can0 detail websocket 연결됨")
                }

                ws.onmessage = ((event) => {
                    console.log("여기까진 실행됨")

                    const data = JSON.parse(event.data)

                    console.log(data)

                    setCan0((prev) => {
                        return{
                            latest : data,

                            history: {
                                current_right: [
                                    ...prev.history.current_right,
                                    data.current_right
                                ].slice(-9000),

                                current_left: [
                                    ...prev.history.current_left,
                                    data.current_left
                                ].slice(-9000),

                                avg_power: [
                                    ...prev.history.avg_power,
                                    Math.round((data.avg_power / 1000) * 10) / 10
                                ].slice(-9000),
                            },

                        }
                    })
                })

                ws.onclose = (event) => {
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
                        min={0}
                        max={100}
                    />
                </div>
                <div className="powerstatus-detail-page-chart-current-r">
                    <MiniLineChart_for_detail
                        data={can0["history"]["current_right"]}
                        color="red"
                        min={0}
                        max={100}
                    />
                </div>
                <div className="powerstatus-detail-page-chart-avg-power">
                    <MiniLineChart_for_detail
                        data={can0["history"]["avg_power"]}
                        color="green"
                        min={0}
                        max={15}
                    />
                </div>
            </div>
            {/* <div className="yawrate-detail-page-pannel">
                <div className="yawrate-detail-page-text min-and-max">

                        <div className="yawrate-detail-page-text-min">

                            <div className="yawrate-detail-page-text-min-text">
                                최솟값
                            </div>
                            <div className="yawrate-detail-page-text-min-data">
                                    {calculate_data.min_yawrate} / {calculate_data.min_desired_yawrate}
                            </div>
        
                        </div>
                        <div className="yawrate-detail-page-text-max">
                            
                            <div className="yawrate-detail-page-text-max-text">
                                최대값
                            </div>
                            <div className="yawrate-detail-page-text-max-data">
                                {calculate_data.max_yawrate} / {calculate_data.max_desried_yawrate}
                            </div>

                        </div>
                </div>
                <div className="yawrate-detail-page-text average-average-error">
                    <div className="yawrate-detail-page-text-average">
                        <div className="yawrate-detail-page-text-average-text">
                            평균
                        </div>
                        <div className="yawrate-detail-page-text-average-data">
                            {calculate_data.yawrate_avg}  / {calculate_data.desried_yawrate_avg}
                        </div>
                    </div>
                    <div className="yawrate-detail-page-text-average-error">
                        <div className="yawrate-detail-page-text-average-error-text">
                            평균 오차
                        </div>
                        <div className="yawrate-detail-page-text-average-error-data">
                            {calculate_data.avg_err}
                        </div>
                    </div>
                </div>
            </div> */}
        </div>

    )
}

export default PowerStatusDetailPage


