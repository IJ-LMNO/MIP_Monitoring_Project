import { useState, useRef, useEffect, useMemo } from "react";
import MiniLineChart_for_detail from "../../../components/common/MinLineChart_for_detail/MiniLineChart_for_detail"

import "./RollrateDetailPage.css"

function RollrateDetailPage(){

    const [rollrate, setRollrate] = useState({
        latest: 0.0,
        history: [],
    });

    const [error, setError] = useState(null);

    const first_telemetry = useRef(false)


    useEffect(() => {
        let timer = null 
    
        const start_telemetry = async () => {
            let rollrate_arr = []

            if (!first_telemetry.current) {
                console.log("첫번째 로직 시작")
                try {
                    const response_can1 = await fetch(
                        "http://localhost:8000/first/detail/rollrate"
                    )

                    const rollrate = await response_can1.json()


                    for (let i = 0; i < rollrate["rollrate"].length; i++){
                        rollrate_arr.push(rollrate["rollrate"][i]["latest"])
                    }

                    if(response_can1.ok){
                        setRollrate((prev) => {
                            return {
                                ...prev,
                                history: rollrate_arr
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
                let ws = new WebSocket("ws://localhost:8000/detail/rollrate")

                ws.onopen = () =>{
                    console.log("yawrate detail websocket 연결됨")
                }

                ws.onmessage = ((event) => {
                    const data = JSON.parse(event.data)
                    setRollrate((prev) => {
                        return{
                            latest : data["rollrate"],
                            history : [
                                ...prev.history,
                                data["rollrate"]
                            ].slice(-9000)
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
        <div className="rollrate-detail-page">
            <div className="rollrate-detail-page-chart">
                <MiniLineChart_for_detail
                    data={rollrate["history"]}
                    min={-10}
                    max={10}
                />
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

export default RollrateDetailPage


