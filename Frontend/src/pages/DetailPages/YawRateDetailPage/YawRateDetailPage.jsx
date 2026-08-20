import { useState, useRef, useEffect, useMemo } from "react";
import TwoMiniLineChart_for_detail from "../../../components/common/TwoMiniLineChart_for_detail/TwoMiniLineChart_for_detail"

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

    function caculate(){
        let min_yawrate = 0
        let max_yawrate = 0
        let min_desired_yawrate = 0
        let max_desried_yawrate = 0
        let yawrate_avg = 0
        let yawrate_sum = 0
        let desried_yawrate_avg = 0
        let desired_yawrate_sum = 0
        let avg_err = 0

        if(yawrate["history"].length == 0 || desiredYawrate["history"].length == 0 ){

            return {
                min_yawrate,
                max_yawrate,
                min_desired_yawrate,
                max_desried_yawrate,
                yawrate_avg,
                desried_yawrate_avg,
                avg_err
            }


            
        }
        min_yawrate = Math.min(...yawrate["history"])
        max_yawrate = Math.max(...yawrate["history"])

        min_desired_yawrate = Math.min(...desiredYawrate["history"])
        max_desried_yawrate = Math.max(...desiredYawrate["history"])

        yawrate_sum = yawrate["history"].reduce((acc, cur) => acc + cur, 0)
        yawrate_avg = yawrate_sum / yawrate["history"].length

        desired_yawrate_sum = desiredYawrate["history"].reduce((acc, cur) => acc + cur, 0)
        desried_yawrate_avg = desired_yawrate_sum / desiredYawrate["history"].length

        avg_err = yawrate_avg - desried_yawrate_avg

        return{
            min_yawrate,
            max_yawrate,
            min_desired_yawrate,
            max_desried_yawrate,
            yawrate_avg,
            desried_yawrate_avg,
            avg_err
        }
    }

    const calculate_data = useMemo(() =>{
        return caculate();
    },[yawrate["history"], desiredYawrate["history"]])

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
        <div className="yawrate-detail-page">
            <div className="yawrate-detail-page-chart">
                <TwoMiniLineChart_for_detail
                    yawrate={yawrate["history"]}
                    desiredyawrate={desiredYawrate["history"]}
                />
            </div>
            <div className="yawrate-detail-page-pannel">
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
            </div>
        </div>

    )
}

export default YawRateDetailPage


