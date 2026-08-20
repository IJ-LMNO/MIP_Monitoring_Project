import { useEffect, useRef, useState } from "react";

import PowerStatusPanel from "../../components/panels/PowerStatusPanel/PowerStatusPannel_for_mqtt";
import SpeedStatusPanel from "../../components/panels/SpeedStatusPanel/SpeedStatusPannel_for_mqtt";
import YawRatePanel from "../../components/panels/YawRateRanel/YawRatepannel_for_mqtt";
import BatteryStatusPaneel from "../../components/panels/BatteryStatusPanel/BatteryStatusPannel_for_mqtt";
import RollRatePannel from "../../components/panels/RollRateStatusPannel/RollRateStatusPannel_for_mqtt";
import CarStatusPannel from "../../components/panels/CarStatusPannel/CarStatusPannel_for_mqtt";
import RaceButton from "../../components/panels/RaceControlButton/Button";
import Timer from "../../components/common/Timer/Timer";
import RpmPannel from "../../components/panels/RpmStatusPannel/RpmStatusPannel_for_mqtt";
import GpsMaPPannel from "../../components/panels/GpsMapPannel/GpsMapPannel_for_Mqtt";
import DropdownMenu from "../../components/panels/DropdownMenu/DropdownMenu";

import "./Dashboard.css";

const API_BASE_URL = "ws://localhost:8000";



function Dashboard() {
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

    const [tps, setTps] = useState({
        latest: 0.0,
        history: [],
        version: 0,
    });

    const [desiredYawrate, setDesiredYawrate] = useState({
        latest: 0.0,
        history: [],
        version: 0,
    });

    const [gps, setGps] = useState({
        latest: {
            timestamp: 0.0,
            latitude: 0.0,
            longitude: 0.0,
        },
        history: [],
        version: 0,
    });

    const [yawrate, setYawrate] = useState({
        latest: 0.0,
        history: [],
        version: 0,
    });

    const [rollrate, setRollrate] = useState({
        latest: 0.0,
        history: [],
        version: 0,
    });

    const [steeringhandle, setSteeringhandle] = useState({
        latest: 0.0,
        history: [],
        version: 0,
    });

    const [tiredegree, setTireDegree] = useState({
        latest: 0.0,
        history: [],
        version: 0,
    });

    const [racestart, setRacestart] = useState({
        start: false,
        reset: false,
    });

    const [elapsedMs, setElapsedMs] = useState(0);
    const [error, setError] = useState(null);


    const downloadRaceLog = async () => {
        try {
            const response = await fetch(
                `http://localhost:8000/race/latest/download`
            );

            if (response.status === 404) {
                alert("주행로그 없음");
                return;
            }

            if (!response.ok) {
                throw new Error(
                    `다운로드 실패: ${response.status}`
                );
            }

            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = downloadUrl;
            link.download = "race_log.json";

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    async function fetchButton() {
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
            console.error(error)
            setError(error.message)
        }

    }

    useEffect(() => {
        let stopped = false;
        let timer = null;

        let can0 = null;
        let can1 = null;
        let gps = null;

        const initial_check_time = 100;
        
        const start = async () => {

            while (!stopped) {

                const first_response = await frontend_start();

                if (first_response === true) {
                    break;
                }

                await new Promise((resolve) => {
                    timer = setTimeout(resolve, initial_check_time);
                });
            }

            if (stopped) {
                return;
            }

            can0 = new WebSocket(
                `${API_BASE_URL}/telemetry/can0/ws`
            );

            can1 = new WebSocket(
                `${API_BASE_URL}/telemetry/can1/ws`
            );

            gps = new WebSocket(
                `${API_BASE_URL}/telemetry/gps/ws`
            );

            //can0 websocket
            can0.onopen = () => {
                console.log("can0 websocket 연결됨");
            };

            can0.onmessage = (event) => {
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
                                data.latest.avg_power
                            ].slice(-40),
                        },

                        version: data["version"]
                    };
                });
            };

            can0.onclose = (event) => {
                console.log("can0 통신 종료");
            };


            //can1 websocket
            can1.onopen = () => {
                console.log("can1 websocket 연결됨");
            };

            can1.onmessage = (event) => {
                const data = JSON.parse(event.data);

                setTps((prev) => {
                    return {
                        latest: data["tps"],
                        history: [
                            ...prev.history,
                            data["tps"]
                        ].slice(-40),
                        version: data["version"]
                    };
                });

                setDesiredYawrate((prev) => {
                    return {
                        latest: data["desired_yawrate"],
                        history: [
                            ...prev.history,
                            data["desired_yawrate"]
                        ].slice(-40),
                        version: data["version"]
                    };
                });

                setYawrate((prev) => {
                    return {
                        latest: data["yawrate"],
                        history: [
                            ...prev.history,
                            data["yawrate"]
                        ].slice(-40),
                        version: data["version"]
                    };
                });

                setRollrate((prev) => {
                    return {
                        latest: data["rollrate"],
                        history: [
                            ...prev.history,
                            data["rollrate"]
                        ].slice(-40),
                        version: data["version"]
                    };
                });

                setSteeringhandle((prev) => {
                    return {
                        latest: data["steeringhandle"],
                        history: [
                            ...prev.history,
                            data["steeringhandle"]
                        ].slice(-40),
                        version: data["version"]
                    };
                });

                setTireDegree((prev) => {
                    return {
                        latest: data["tiredegree"],
                        history: [
                            ...prev.history,
                            data["tiredegree"]
                        ].slice(-40),
                        version: data["version"]
                    };
                });
            };

            can1.onclose = (event) => {
                console.log("can1 통신 종료", event.code);
            };


            //gps websocket
            gps.onopen = () => {
                console.log("gps websocket 연결됨 : ");
            };

            gps.onmessage = (event) => {
                const data = JSON.parse(event.data);

                setGps((prev) => {
                    return {
                        latest: data["latest"],

                        history: [
                            ...prev.history,
                            data["latest"]
                        ].slice(-40),

                        version: data["version"]
                    };
                });
            };

            gps.onclose = (evnet) => {
                console.log("gps 통신 종료", event.code);
            };

        };
        start();

        return () => {
            stopped = true;

            if (timer !== null) {
                clearTimeout(timer);
            }

            if (can0 !== null) {
                can0.close();
            }

            if (can1 !== null) {
                can1.close();
            }

            if (gps !== null) {
                gps.close();
            }
        };

    }, []);

    

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div className="header_dropbox_button">
                    <DropdownMenu
                        latest_race_download={downloadRaceLog}
                    />
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
                    <div className="powerstatus-panel">
                        <PowerStatusPanel can0={can0} />
                    </div>

                    <div className="gpsmap-pannel">
                        <GpsMaPPannel gps={gps} />
                    </div>

                    <div className="yawrate-rollrate-pannel">
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
                    </div>
                </div>

                <div className="dashboard-page-bottom">
                    <div className="speedstatus-battery-pannel">
                        <div className="speedstatus-pannel">
                            <SpeedStatusPanel
                                speed={can0.latest.speed}
                            />
                        </div>

                        <div className="battery-pannel">
                            <BatteryStatusPaneel
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
                    onClick={fetchButton}
                    text={
                        racestart.start
                            ? "주행 종료"
                            : racestart.reset
                                ? "초기화"
                                : "주행 시작"
                    }
                    state={racestart}
                />
            </div>
        </div>
    );
}

export default Dashboard;