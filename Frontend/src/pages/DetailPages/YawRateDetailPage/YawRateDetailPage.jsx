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
                console.log("line31 : ok")
                try {
                    const response_can1 = await fetch(
                        "http://localhost:8000/first/detail/yawrate"
                    )

                    const can1 = await response_can1.json()
    

                    if(response_can1.ok){


                        for(let i =0; i < length(can1); i++){
                            yawrate_arr.append(can1["yawrate"]["latest"])
                            desired_yawrate_arr.append(can1["desired_yawrate"]["latest"])
                        }

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
                console.log("두번쨰 로직 시작")
            }
        
            
            start_telemetry()

            return(() => {
                clearTimeout(timer)
            })

        }

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


