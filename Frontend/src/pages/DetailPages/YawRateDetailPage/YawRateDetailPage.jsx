import { useState, useRef, useEffect } from "react";
import TwoMiniLineChart from "../../../components/common/TwoMiniLineChart/TwoMiniLineChart_for_mqtt"

import "./YawRateDetailPage.css"

function YawRateDetailPage(){
    const TIME = 5000


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
    const fetch_time = useRef(TIME)
    const hysteresis_time = useRef(null)

    function startTelemetry_for_yawrate_desiredyawrate() {
        let timer = null
        let size = null
        let stop = false

        const start_telemetry = async () => {
            if (!first_telemetry.current) {
                try {
                    const response_yawrate = await fetch(
                        "http://localhost:8000/detail/first/yawrate"
                    )
                    const response_desired_yawrate = await fetch(
                        "http://localhost:8000/detail/first/desired/yawrate"
                    )

                    const yawrate_data = await response_yawrate.json()
                    const desired_yawrate_data = await response_desired_yawrate.json()

                    setYawrate((prev) => {
                        return {
                            ...prev,
                            history: yawrate_data["history"]
                        }
                    })

                    setDesiredYawrate((prev) => {
                        return {
                            ...prev,
                            history: desired_yawrate_data["history"]
                        }
                    })

                } catch (err) {
                    setError(err)
                }
                finally {
                    timer = setTimeout(start_telemetry, fetch_time.current);
                    first_telemetry.current = true
                }
            }
            else {
                try {
                    const response_yawrate = await fetch(
                        "http://localhost:8000/detail/yawrate"
                    )
                    const response_desired_yawrate = await fetch(
                        "http://localhost:8000/detail/desired/yawrate"
                    )

                    const yawrate_data = await response_yawrate.json()
                    const desired_yawrate_data = await response_desired_yawrate.json()

                    setYawrate((prev) => {
                        return {
                            latest: yawrate_data["latest"],
                            history: [...prev, yawrate_data["latest"]]
                        }
                    })

                    setDesiredYawrate((prev) => {
                        return {
                            latest: desired_yawrate_data["latest"],
                            history: [...prev, desired_yawrate_data["latest"]]
                        }
                    })


                } catch (err) {
                    setError(err)
                }
                finally {
                    timer = setTimeout(start_telemetry, fetch_time.current);
                }

                if (size >= 3) {
                    if (hysteresis_time.currnent == null) {
                        hysteresis_time.current = performance.now()
                    }

                    if (performance.now() - hysteresis_time.current > 3000) {
                        fetch_time.current = TIME / 2
                        hysteresis_time.current = performance.now()
                    }
                }
                else {
                    fetch_time.current = TIME
                    hysteresis_time.current = null
                }
            }
        }

        start_telemetry()

        return() =>{
            clearTimeout(timer)
        }
    }

    // useEffect(() => {

    //     const cleanup = startTelemetry_for_yawrate_desiredyawrate()

    //     return () =>{
    //         cleanup()
    //     }

    // }, []);

    return(
        // <div className="yawrate-desired-yawrate-detail-page">
        //     <div className="chart">
        //         <TwoMiniLineChart 
        //             yawrate={yawrate["history"]}
        //             desiredyawrate={desiredYawrate["history"]}
        //         />
        //     </div>
        // </div>
        <div>
            구현예정
        </div>
    )
}

export default YawRateDetailPage


