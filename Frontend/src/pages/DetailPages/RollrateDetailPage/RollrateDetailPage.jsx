import { useState, useRef, useEffect, useMemo } from "react";
import MiniLineChart_for_detail from "../../../components/common/MinLineChart_for_detail/MiniLineChart_for_detail"
import GpsPannel from "../../../components/pannels/GpsMapPannel/GpsMapPannel_for_detail"
import StopButton from "../../DetailPageStopButon/DetailPageStopButton"

import "./RollrateDetailPage.css"

function RollrateDetailPage() {


    //--------------------------------------------------------------------------------------
    // rollrate
    //--------------------------------------------------------------------------------------- 
    const [rollrate, setRollrate] = useState({
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
    const rollrateSliceValue = 2400
    const gpsSliceValue = 120


    //--------------------------------------------------------------------------------------
    // DetailPageStop state
    //--------------------------------------------------------------------------------------- 
    const [stopsiginal, setStopsignal] = useState({
        "state": false, // false : 진행, true : 멈춤
        "color": "red",
        "text": "Stop!",
        "data" : null
    })



    //--------------------------------------------------------------------------------------
    // const[idx, setIdx] = useState에 따른 데이터를 화면에 표시하기 위한 함수
    //--------------------------------------------------------------------------------------- 
    function returnValue() {
        const len = rollrate["history"].length

        if (mouseoveridx.idx == null)
            return null

        if (mouseoveridx.idx < 0 || mouseoveridx.idx >= len) {
            return null
        }
        else {
            return (
                <>
                    <div className="powerstatus-detail-page-value-type" style={{ color: mouseoveridx.type }}>
                        rollrate
                    </div>
                    <div className="powerstatus-detail-page-value-value">
                        {stopsiginal.state ? stopsiginal["data"][mouseoveridx.idx][0] : rollrate["history"][mouseoveridx.idx][0]}
                    </div>
                </>
            )
        }
    }

    useEffect(() => {
        let timer = null
        let ws_rollrate = null
        let ws_gps = null

        const start_telemetry = async () => {
            let rollrate_arr = []
            let gps_arr = []
            let len = null

            if (!first_telemetry.current) {
                console.log("첫번째 로직 시작")
                try {
                    const response_rollrate = await fetch(
                        "http://localhost:8000/first/detail/rollrate"
                    )

                    const response_gps = await fetch(
                        "http://localhost:8000/first/detail/gps/rollrate"
                    );

                    const data = await response_rollrate.json()
                    const gps = await response_gps.json()


                    len = data["rollrate"].length
                    for (let i = 0; i < len; i++) {
                        rollrate_arr.push([data["rollrate"][i]["rollrate"], data["rollrate"][i]["timestamp"]])
                    }

                    for (let i = 0; i < gps.length; i++) {
                        gps_arr.push(gps[i]);
                    }


                    if (rollrate_arr.length > rollrateSliceValue) {
                        rollrate_arr = rollrate_arr.slice(-rollrateSliceValue)
                    }
                    if (gps_arr.length > gpsSliceValue) {
                        gps_arr = gps_arr.slice(-gpsSliceValue)
                    }


                    if (response_rollrate.ok && response_gps.ok) {
                        setRollrate(() => {
                            return {
                                history: rollrate_arr
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
                    else {
                        timer = setTimeout(start_telemetry, 1000)
                    }

                } catch (err) {
                    setError(err)
                    console.log(err)
                    timer = setTimeout(start_telemetry, 1000)
                }
            } else {
                console.log("두번째 로직 시작")
                const ws_rollrate = new WebSocket("ws://localhost:8000/detail/rollrate")
                const ws_gps = new WebSocket("ws://localhost:8000/detail/gps/rollrate");

                ws_rollrate.onopen = () => {
                    console.log("rollrate detail websocket 연결됨")
                }

                ws_gps.onopen = () => {
                    console.log("gps detail websocket 연결됨");
                };


                ws_rollrate.onmessage = ((event) => {
                    const data = JSON.parse(event.data)
                    setRollrate((prev) => {
                        return {
                            history: [
                                ...prev.history,
                                [data["rollrate"]["rollrate"], data["rollrate"]["timestamp"]]
                            ].slice(-rollrateSliceValue)
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
                            ].slice(-gpsSliceValue)
                        };
                    });
                };


                ws_rollrate.onclose = (event) => {
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

        return (() => {
            if (timer !== null) {
                clearTimeout(timer);
            }

            if (ws_rollrate !== null) {
                ws_rollrate.close();
            }

            if (ws_gps !== null) {
                ws_gps.close();
            }
        })

    }, [])


    return (
        <div className="rollrate-detail-page">
            <div className="rollrate-detail-page-chart">
                <MiniLineChart_for_detail
                    data={rollrate["history"]}
                    setMouseoveridx={setMouseoveridx}
                    setMouseovertimestamp={setMouseovertimestamp}
                    strokeWidth={0.5}
                    stopsiginal={stopsiginal}
                    setStopsignal={setStopsignal}
                    maxlen={rollrateSliceValue}
                />
            </div>

            <div className="rollrate-detail-page-gps-and-value">
                <div className="rollrate-detail-page-gps-pannel">
                    <div className="rollrate-detail-page-gps">
                        <GpsPannel
                            gps={gps.gps}
                            mouseovertimestamp={mouseovertimestamp}
                            stopsiginal={stopsiginal}
                        />
                    </div>

                </div>

                <div className="rollrate-detail-page-button">
                    <StopButton
                        stopsiginal={stopsiginal}
                        setStopsiginal={setStopsignal} />
                </div> 

                <div className="rollrate-detail-page-value">
                    {returnValue()}
                </div>

            </div>

        </div>

    )
}

export default RollrateDetailPage