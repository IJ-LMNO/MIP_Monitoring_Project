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
        </div>

    )
}

export default RollrateDetailPage


