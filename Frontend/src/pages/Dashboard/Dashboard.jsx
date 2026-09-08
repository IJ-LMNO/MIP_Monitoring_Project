import { useEffect, useRef, useState } from "react";

import PowerStatusPannel from "../../components/pannels/PowerStatusPannel/PowerStatusPannel_for_mqtt";
import SpeedStatusPannel from "../../components/pannels/SpeedStatusPannel/SpeedStatusPannel_for_mqtt";
import YawRatePannel from "../../components/pannels/YawRateRannel/YawRatepannel_for_mqtt";
import BatteryStatusPannel from "../../components/pannels/BatteryStatusPannel/BatteryStatusPannel_for_mqtt";
import RollRatePannel from "../../components/pannels/RollRateStatusPannel/RollRateStatusPannel_for_mqtt";
import CarStatusPannel from "../../components/pannels/CarStatusPannel/CarStatusPannel_for_mqtt";
import RaceButton from "../../components/pannels/RaceControlButton/Button";
import Timer from "../../components/common/Timer/Timer";
import RpmPannel from "../../components/pannels/RpmStatusPannel/RpmStatusPannel_for_mqtt";
import GpsMaPPannel from "../../components/pannels/GpsMapPannel/GpsMapPannel_for_Mqtt";
import DropdownMenu from "../../components/pannels/DropdownMenu/DropdownMenu";
import FaceButton from "../../components/pannels/FaceButton/FaceButton";
import RacePannel from "../../components/pannels/RacePannel/RacePannel"
import RapButton from "../../components/pannels/RapButton/RapButton"

import "./Dashboard.css";

const API_BASE_URL = "ws://localhost:8000";

function Dashboard() {

    //--------------------------------------------------------------------------------------
    // can0 
    //---------------------------------------------------------------------------------------
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

        timestamp : null
    });





    //--------------------------------------------------------------------------------------
    // can1 (tps, desired_yawrate, yawrate, steeringhandle, tiredegree)
    //---------------------------------------------------------------------------------------
    const [tps, setTps] = useState({
        latest: 0.0,
        history: [],
        timestamp : null
    });

    const [desiredYawrate, setDesiredYawrate] = useState({
        latest: 0.0,
        history: [],
        timestamp: null
    });


    const [yawrate, setYawrate] = useState({
        latest: 0.0,
        history: [],
        timestamp: null
    });

    const [rollrate, setRollrate] = useState({
        latest: 0.0,
        history: [],
        timestamp: null
    });

    const [steeringhandle, setSteeringhandle] = useState({
        latest: 0.0,
        history: [],
        timestamp: null
    });

    const [tiredegree, setTireDegree] = useState({
        latest: 0.0,
        history: [],
        timestamp: null
    });





    //--------------------------------------------------------------------------------------
    // gps
    //---------------------------------------------------------------------------------------
    const [gps, setGps] = useState({
        latest: {
            latitude: 0.0,
            longitude: 0.0,
            status : null
        },
        history: [],
        timestamp: null

    });





    //--------------------------------------------------------------------------------------
    // button 
    //---------------------------------------------------------------------------------------
    const [button, setButton] = useState(
        {
            latest: {
                "time_interval": null,
                "rap": null
            },
            history: []
        }
    )





    //--------------------------------------------------------------------------------------
    // race start / stop / reset 상태 갱신을 위한 state
    //---------------------------------------------------------------------------------------
    const [racestart, setRacestart] = useState({
        start: false,
        reset: false,
    });




    //--------------------------------------------------------------------------------------
    // race start button에 따른 Timer 갱신을 위한 state
    //---------------------------------------------------------------------------------------
    const [elapsedMs, setElapsedMs] = useState(0);


    


    //--------------------------------------------------------------------------------------
    // pace button에 따른 상태 갱신을 위한 state 
    //  -> Hold, Up, Down
    //---------------------------------------------------------------------------------------
    const [face, setFace] = useState({
        state : "Hold" // Hold, Up, Down
    })



    //--------------------------------------------------------------------------------------
    // rap button에 따른 rap 갱신을 위한 state
    //---------------------------------------------------------------------------------------
    const[rapcount, setRapcount] = useState({
        "state" : false,
        "history" : [],
        
    })



    //--------------------------------------------------------------------------------------
    // error 갱신을 위한 state
    //---------------------------------------------------------------------------------------
    const [error, setError] = useState(null);









//--------------------------------------------------------------------------------------
// useEffect
//---------------------------------------------------------------------------------------
    useEffect(() => {

        //--------------------------------------------------------------------------------------
        // stopped : useEffect close시 함수 정리를 위한 변수
        // initial_check_front_back_telemetry : 프론트와 백이 연결되었는지 체크하기 위한 변수
        // intial_check_time : 프론트와 백간의 연결이 성공하지 못했을떄, 다음 시도까지의 시간
        // timer : setinterval을 저장하는 변수
        //---------------------------------------------------------------------------------------       
        let stopped = false;
        let inital_check_front_back_telemetry = false
        let timer = null;
        const initial_check_time = 10;


        //--------------------------------------------------------------------------------------
        // websocket을 위한 변수
        //--------------------------------------------------------------------------------------- 
        let can0_ws = null;
        let can1_ws = null;
        let gps_ws = null;
        let btn_ws = null;


        const telemetry = async () => {

            while (!inital_check_front_back_telemetry) {

                const first_response = await frontend_start();

                if (first_response === true) {
                    inital_check_front_back_telemetry = true
                }

                await new Promise((resolve) => {
                    timer = setTimeout(resolve, initial_check_time);
                });
            }

            if (stopped) {
                return;
            }


            //--------------------------------------------------------------------------------------
            // websocket 객체 생성
            //--------------------------------------------------------------------------------------- 
            can0_ws = new WebSocket(
                `${API_BASE_URL}/telemetry/can0/ws`
            );

            can1_ws = new WebSocket(
                `${API_BASE_URL}/telemetry/can1/ws`
            );

            gps_ws = new WebSocket(
                `${API_BASE_URL}/telemetry/gps/ws`
            );

            btn_ws = new WebSocket(
                `${API_BASE_URL}/telemetry/button/ws`
            );

            

            //--------------------------------------------------------------------------------------
            // can0 websocket
            //--------------------------------------------------------------------------------------- 
            can0_ws.onopen = () => {
                console.log("can0 websocket 연결됨");
            };

            can0_ws.onmessage = (event) => {
                const data = JSON.parse(event.data);

                setCan0((prev) => {
                    return {
                        latest: data["latest"],

                        history: {
                            current_right: [
                                ...prev.history.current_right,
                                data.latest.current_right
                            ].slice(-40),

                            current_left: [
                                ...prev.history.current_left,
                                data.latest.current_left
                            ].slice(-40),

                            avg_power: [
                                ...prev.history.avg_power,
                                Math.round((data.latest.avg_power / 1000) * 10) / 10
                            ].slice(-40),
                        },

                        timestamp : data["timestamp"]
                    };
                });
            };

            can0_ws.onclose = (event) => {
                console.log("can0 통신 종료");
            };






            //--------------------------------------------------------------------------------------
            // can1 websocket
            //--------------------------------------------------------------------------------------- 
            can1_ws.onopen = () => {
                console.log("can1 websocket 연결됨");
            };

            can1_ws.onmessage = (event) => {
                const data = JSON.parse(event.data);

                setTps((prev) => {
                    return {
                        latest: data["tps"],
                        history: [
                            ...prev.history,
                            data["tps"]
                        ].slice(-40),
                        timestamp : data["timestamp"]
                    };
                });

                setDesiredYawrate((prev) => {
                    return {
                        latest: data["desired_yawrate"],
                        history: [
                            ...prev.history,
                            data["desired_yawrate"]
                        ].slice(-40),
                        timestamp: data["timestamp"]
                    };
                });

                setYawrate((prev) => {
                    return {
                        latest: data["yawrate"],
                        history: [
                            ...prev.history,
                            data["yawrate"]
                        ].slice(-40),
                        timestamp: data["timestamp"]
                    };
                });

                setRollrate((prev) => {
                    return {
                        latest: data["rollrate"],
                        history: [
                            ...prev.history,
                            data["rollrate"]
                        ].slice(-40),
                        timestamp: data["timestamp"]
                    };
                });

                setSteeringhandle((prev) => {
                    return {
                        latest: data["steeringhandle"],
                        history: [
                            ...prev.history,
                            data["steeringhandle"]
                        ].slice(-40),
                        timestamp: data["timestamp"]
                    };
                });

                setTireDegree((prev) => {
                    return {
                        latest: data["tiredegree"],
                        history: [
                            ...prev.history,
                            data["tiredegree"]
                        ].slice(-40),
                        timestamp: data["timestamp"]
                    };
                });
            };

            can1_ws.onclose = (event) => {
                console.log("can1 통신 종료", event.code);
            };


            




            //--------------------------------------------------------------------------------------
            // gps websocket
            //--------------------------------------------------------------------------------------- 
            gps_ws.onopen = () => {
                console.log("gps websocket 연결됨 : ");
            };

            gps_ws.onmessage = (event) => {
                const data = JSON.parse(event.data);

                setGps((prev) => {
                    return {
                        latest: data["latest"],

                        history: [
                            ...prev.history,
                            data["latest"]
                        ].slice(-40),

                        timestamp: data["timestamp"]
                    };
                });

            };

            gps_ws.onclose = (event) => {
                console.log("gps 통신 종료", event.code);
            };







            //--------------------------------------------------------------------------------------
            // button websocket
            //--------------------------------------------------------------------------------------- 
            btn_ws.onopen = () => {
                console.log("button websocket 연결됨 : ");
            };

            btn_ws.onmessage = (event) => {
                const data = JSON.parse(event.data);

                setButton((prev) => {
                    return {
                        latest : data,

                        history: [
                            ...prev.history,
                            data
                        ]
                    };
                });
            };

            btn_ws.onclose = (event) => {
                console.log("gps 통신 종료", event.code);
            };

        };




        //--------------------------------------------------------------------------------------
        // telemetry 최초 실행
        //--------------------------------------------------------------------------------------- 
        telemetry();



        return () => {
            stopped = true;

            if (timer !== null) {
                clearTimeout(timer);
            }

            if (can0_ws !== null) {
                can0_ws.close();
            }

            if (can1_ws !== null) {
                can1_ws.close();
            }

            if (gps_ws !== null) {
                gps_ws.close();
            }

            if (btn_ws !== null) {
                btn_ws.close();
            }
        };
    },[])










        


//--------------------------------------------------------------------------------------
//  다운도드를 위한 함수
//---------------------------------------------------------------------------------------
    // const downloadRaceLog = async () => {
    //     try {
    //         const response = await fetch(
    //             `http://localhost:8000/race/latest/download`
    //         );

    //         if (response.status === 404) {
    //             alert("주행로그 없음");
    //             return;
    //         }

    //         if (!response.ok) {
    //             throw new Error(
    //                 `다운로드 실패: ${response.status}`
    //             );
    //         }

    //         const blob = await response.blob();
    //         const downloadUrl = URL.createObjectURL(blob);

    //         const link = document.createElement("a");

    //         link.href = downloadUrl;
    //         link.download = "race_log.json";

    //         document.body.appendChild(link);
    //         link.click();
    //         link.remove();

    //         URL.revokeObjectURL(downloadUrl);
    //     } catch (error) {
    //         console.error(error);
    //         alert(error.message);
    //     }
    // };










//--------------------------------------------------------------------------------------
// race start / stop / reset 상태를 백으로 전송하는 함수
//--------------------------------------------------------------------------------------- 
    async function fetchRaceStartButton() {
        try {
            if (racestart.start === false) {
                if (racestart.reset === false) {
                    const response = await fetch(
                        "http://localhost:8000/race/start",
                        {
                            method: "POST",
                        }
                    );

                    if (!response.ok) {
                        throw new Error(
                            `주행 시작 실패: ${response.status}`
                        );
                    }

                    setRacestart({
                        start: true,
                        reset: false,
                    });
                } else {
                    const response = await fetch(
                        "http://localhost:8000/race/reset",
                        {
                            method: "POST",
                        }
                    );

                    if (!response.ok) {
                        throw new Error(
                            `초기화 실패: ${response.status}`
                        );
                    }

                    setRacestart({
                        start: false,
                        reset: false,
                    });
                }
            } else {
                const response = await fetch(
                    "http://localhost:8000/race/stop",
                    {
                        method: "POST",
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `주행 종료 실패: ${response.status}`
                    );
                }

                setRacestart({
                    start: false,
                    reset: true,
                });
            }

            setError(null);
        } catch (error) {
            console.error(error);
            setError(error.message);
        }
    }









//--------------------------------------------------------------------------------------
// pace up에 대한 state 변화를 백으로 전송하는 함수
//--------------------------------------------------------------------------------------- 
    async function FaceUpFetchButton() {
        try{
            if (face["state"] === "Down") {
                await fetch(
                    "http://localhost:8000/face/up",
                    {
                        method: "POST",
                        headers: {
                            "Content-type": "application/json"
                        },
                        body: JSON.stringify({
                            "status": "Hold"
                        })
                    }
                )

                setFace({
                    state: "Hold"
                })
            }
            else if (face["state"] === "Hold") {
                await fetch(
                    "http://localhost:8000/face/up",
                    {
                        method: "POST",
                        headers: {
                            "Content-type": "application/json"
                        },
                        body: JSON.stringify({
                            "status": "Up"
                        })
                    }
                )

                setFace({
                    state: "Up"
                })

            }

        }catch(err){
            console.log("line 244 : 뭔가 오류 발생 : " ,{err} )
        }

    }











//--------------------------------------------------------------------------------------
// pace down에 대한 state 변화를 백으로 전송하는 함수
//--------------------------------------------------------------------------------------- 
    async function FaceDownFetchButton() {
        try {
            if (face["state"] === "Up") {
                const response = await fetch(
                    "http://localhost:8000/face/down",
                    {
                        method: "POST",
                        headers: {
                            "Content-type": "application/json"
                        },
                        body: JSON.stringify({
                            "status": "Hold"
                        })
                    }
                )

                setFace({
                    state: "Hold"
                })
            }
            else if (face["state"] === "Hold") {
                await fetch(
                    "http://localhost:8000/face/down",
                    {
                        method: "POST",
                        headers: {
                            "Content-type": "application/json"
                        },
                        body: JSON.stringify({
                            "status": "Down"
                        })
                    }
                )

                setFace({
                    state: "Down"
                })

            }

        } catch (err) {
            console.log("line 244 : 뭔가 오류 발생 : ", { err })
        }
    }












//--------------------------------------------------------------------------------------
// 프론트가 실행되었음을 백으로 알리는 함수
//--------------------------------------------------------------------------------------- 
    async function frontend_start(){
        try{
            const response = await fetch(
                "http://localhost:8000/frontend/start",
                {
                    method : "POST",
                    headers : {
                        "Content-type" : "application/json"
                    },
                    body : JSON.stringify({
                        "status" : true
                    })
                }
            )

            return response.ok

        }
        catch(err){
            console.error("서버가 켜져있는지 확인")
        }

    }
















//--------------------------------------------------------------------------------------
// return
//--------------------------------------------------------------------------------------- 
    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div className="header_dropbox_button">
                    <DropdownMenu/>
                </div>

                <div
                    className={
                        racestart.start
                            ? "race-reset-button-header"
                            : racestart.reset
                                ? "race-stop-button-header"
                                : "race-start-button-header"
                    }
                >
                    <Timer
                        state={racestart}
                        elapsedMs={elapsedMs}
                        setElapsedMs={setElapsedMs}
                    />
                </div>
            </div>

            <div className="dashboard-page-pannel">
                <div className="dashboard-page-top">
                    {/* <div className="powerstatus-panel">
                        <PowerStatusPanel can0={can0} />
                    </div> */}

                    <div className="race-pannel">
                        <RacePannel rapcount={rapcount}/>
                    </div>

                    <div className="gpsmap-pannel">
                        <GpsMaPPannel gps={gps} />
                    </div>

                    {/* <div className="yawrate-rollrate-pannel">
                        <div className="yawrate-pannel">
                            <YawRatePanel
                                yawRate={yawrate}
                                desiredyawRate={desiredYawrate}
                            />
                        </div>

                        <div className="rollrate-pannel">
                            <RollRatePannel
                                RollRate={rollrate}
                            />
                        </div>
                    </div> */}
                </div>

                <div className="dashboard-page-bottom">
                    <div className="speedstatus-battery-pannel">
                        <div className="speedstatus-pannel">
                            <SpeedStatusPannel
                                speed={can0.latest.speed}
                            />
                        </div>

                        <div className="battery-pannel">
                            <BatteryStatusPannel
                                battery={
                                    can0.latest.avg_voltage
                                }
                            />
                        </div>
                    </div>

                    <div className="rpmstatus-pannel">
                        <RpmPannel
                            rpm_left={
                                can0.latest.rpm_left
                            }
                            rpm_right={
                                can0.latest.rpm_right
                            }
                        />
                    </div>

                    <div className="carstatus-pannel">
                        <CarStatusPannel
                            tiredegree ={tiredegree}
                            steeringhandle={
                                steeringhandle
                            }
                            leftTorque={can0["latest"]["torque_left"]}
                            rightTorque={can0["latest"]["torque_right"]}
    
                        />
                    </div>
                </div>
            </div>

            <div className="dashboard-page-footer">
                <RaceButton
                    onClick={fetchRaceStartButton}
                    text={
                        racestart.start
                            ? "타이머 종료"
                            : racestart.reset
                                ? "초기화"
                                : "타이머 시작"
                    }
                    state={racestart}
                />

                <RapButton
                    text ={
                        rapcount.state ? "기록" : "랩 카운트 시작"
                    }
                    rapcount={rapcount}
                    setRapcount ={setRapcount}
                />

                <FaceButton 
                    text="FaceUp"
                    onClick={FaceUpFetchButton}
                    state={face.state}
                    color={face["state"] === "Up" ? "green" : "white"}
                />
                <FaceButton
                    text="FaceDown"
                    onClick={FaceDownFetchButton}
                    state={face.state}
                    color={face["state"] === "Down" ? "red" : "white"}
                />

            </div>
        </div>
    );
    //----------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------
}

export default Dashboard;