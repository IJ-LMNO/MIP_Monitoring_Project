import { useState, useRef, useEffect } from "react";
import TwoMiniLineChart from "../../../components/common/TwoMiniLineChart/TwoMiniLineChart_for_mqtt"

import "./YawRateDetailPage.css"

function YawRateDetailPage(){

    const [desiredYawrate, setDesiredYawrate] = useState({
        latest: 0.0,
        history: [],
    });


    const [yawrate, setYawrate] = useState({
        latest: 0.0,
        history: [],
    });

    const [error, setError] = useState(null);

    const first_telemetry = useRef(false)

    useEffect(() => {
        let timer = null 
    
        const start_telemetry = async () => {
            let yawrate_arr = []
            let desired_yawrate_arr = []

            if (!first_telemetry.current) {
                console.log("첫번째 로직 시작")
                try {
                    const response_can1 = await fetch(
                        "http://localhost:8000/first/detail/yawrate"
                    )

                    const can1 = await response_can1.json()

                    console.log(Array.isArray(can1))

                    for(let i = 0; i < can1.length; i++){
                        yawrate_arr.push(can1[i]["yawrate"]["latest"])
                        desired_yawrate_arr.push(can1[i]["desired_yawrate"]["latest"])
                    }

                    if(response_can1.ok){
                        setYawrate((prev) => {
                            return {
                                ...prev,
                                history: yawrate_arr
                            }
                        })

                        setDesiredYawrate((prev) => {
                            return {
                                ...prev,
                                history: desired_yawrate_arr
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
                let ws = new WebSocket("ws://localhost:8000/detail/yawrate")

                ws.onopen = () =>{
                    console.log("yawrate detail websocket 연결됨")
                }

                ws.onmessage = ((event) => {
                    const data = JSON.parse(event.data)

                    console.log(data)

                    setYawrate((prev) => {
                        return{
                            latest : data["yawrate"],
                            history : [
                                ...prev.history,
                                data["yawrate"]
                            ].slice(-9000)
                        }
                    })

                    setDesiredYawrate((prev) => {
                        return{
                            latest : data["desired_yawrate"],
                            history : [
                                ...prev.history,
                                data["desired_yawrate"]
                            ].slice(-9000)
                        }
                    })
                })


                ws.onclose = () => {
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
        <div className="yawrate-desired-yawrate-detail-page">
            <div className="chart">
                <TwoMiniLineChart 
                    yawrate={yawrate["history"]}
                    desiredyawrate={desiredYawrate["history"]}
                />
            </div>
        </div>
    )
}

export default YawRateDetailPage


