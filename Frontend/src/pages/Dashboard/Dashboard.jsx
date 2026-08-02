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

const API_BASE_URL = "http://localhost:8000";

const CAN0_TIME = 1000;
const CAN1_TIME = 1000;
const GPS_TIME = 1000;


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

    const can0_fetch_time = useRef(CAN0_TIME)
    const can1_fetch_time = useRef(CAN1_TIME)
    const gps_fetch_time = useRef(GPS_TIME)

    function startTelemetry_for_can0(endpoint, setter, intervalTime) {
        const fetchTelemetry = async () => {
            try {
                const response = await fetch(
                    `${API_BASE_URL}${endpoint}`
                );

                if (response.status == 404) {
                    throw new Error(
                        `${endpoint} 요청 실패: ${response.status}`
                    );
                    return
                }

                const data = await response.json();


                setter((prev) => {
                    return{
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
                    }
                });

                if(data["size"] > 5){
                    can0_fetch_time.current = CAN0_TIME / 2
                }
                else{
                    can0_fetch_time.current = CAN0_TIME
                }

                setError(null);
            } catch (error) {
                console.error(error);
                setError(error.message);
            }
        };

        // 화면 진입 직후 한 번 실행
        fetchTelemetry();

        // 이후 주기적으로 실행
        const timer = setTimeout(fetchTelemetry, intervalTime);

        return () => {
            clearTimeout(timer);
        };
    }


    function startTelemetry_for_gps(endpoint, setter, intervalTime) {
        const fetchTelemetry = async () => {
            try {
                const response = await fetch(
                    `${API_BASE_URL}${endpoint}`
                );

                if (response.status == 404) {
                    throw new Error(
                        `${endpoint} 요청 실패: ${response.status}`
                    );
                    return
                }

                const data = await response.json();

                setter((prev) => {
                    return {
                        latest: data["latest"],

                        history : [...prev.history, data["latest"]],
                        version: data["version"]
                    }
                });

                if (data["size"] > 5) {
                    gps_fetch_time.current = GPS_TIME / 2
                }
                else {
                    gps_fetch_time.current = GPS_TIME
                }

                setError(null);
            } catch (error) {
                console.error(error);
                setError(error.message);
            }
        };

        // 화면 진입 직후 한 번 실행
        fetchTelemetry();

        // 이후 주기적으로 실행
        const timer = setTimeout(fetchTelemetry, intervalTime);

        return () => {
            clearTimeout(timer);
        };
    }

    function startTelemetry_for_can1(endpoint, setter, intervalTime) {
        const fetchTelemetry = async () => {
            try {
                const response = await fetch(
                    `${API_BASE_URL}${endpoint}`
                );

                if (response.status == 404) {
                    throw new Error(
                        `${endpoint} 요청 실패: ${response.status}`
                    );
                    return
                }

                const data = await response.json();

                setter((prev) => {
                    return {
                        latest: data["latest"],

                        history: [...prev.history, data["latest"]],
                        version: data["version"]
                    }
                });

                if (data["size"] > 5) {
                    can1_fetch_time.current = CAN1_TIME / 2
                }
                else {
                    can1_fetch_time.current = CAN1_TIME
                }

                setError(null);
            } catch (error) {
                console.error(error);
                setError(error.message);
            }
        };

        fetchTelemetry();

        const timer = setTimeout(fetchTelemetry, intervalTime);

        return () => {
            clearTimeout(timer);
        };
    }

    function telemetryCan0() {
        return startTelemetry_for_can0(
            "/telemetry/can0",
            setCan0,
            can0_fetch_time
        );
    }

    function telemetryTps() {
        return startTelemetry_for_can1(
            "/telemetry/tps",
            setTps,
            can1_fetch_time
        );
    }

    function telemetryDesiredYawrate() {
        return startTelemetry_for_can1(
            "/telemetry/desired-yawrate",
            setDesiredYawrate,
            can1_fetch_time
        );
    }

    function telemetryGps() {
        return startTelemetry_for_gps(
            "/telemetry/gps",
            setGps,
            gps_fetch_time
        );
    }

    function telemetryYawrate() {
        return startTelemetry_for_can1(
            "/telemetry/yawrate",
            setYawrate,
            can1_fetch_time
        );
    }

    function telemetryRollrate() {
        return startTelemetry_for_can1(
            "/telemetry/rollrate",
            setRollrate,
            can1_fetch_time
        );
    }

    function telemetrySteeringhandle() {
        return startTelemetry_for_can1(
            "/telemetry/steeringhandle",
            setSteeringhandle,
            can1_fetch_time
        );
    }

    function telemetryTiredegree() {
        return startTelemetry_for_can1(
            "/telemetry/tiredegree",
            setTireDegree,
            can1_fetch_time
        );
    }

    const downloadRaceLog = async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/race/latest/download`
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
                        `${API_BASE_URL}/race/start`,
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
                        `${API_BASE_URL}/race/reset`,
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
                    `${API_BASE_URL}/race/stop`,
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
                `${API_BASE_URL}/frontend/start`,
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

        }
        catch(err){
            console.error(error)
            setError(error.message)
        }

    }

    useEffect(() => {
        let stopped = false;
        let cleanupFunctions = [];
        let retryTimer = null;


        const startDashboard = async () => {
            const frontendReady = await frontend_start();

            if (stopped) {
                return;
            }

            if (!frontendReady) {
                retryTimer = setTimeout(
                    startDashboard,
                    10
                )
            }
            else{
                console.log("서버 연결 성공")
            }

            cleanupFunctions = [
                telemetryCan0(),
                telemetryTps(),
                telemetryDesiredYawrate(),
                telemetryGps(),
                telemetryYawrate(),
                telemetryRollrate(),
                telemetrySteeringhandle(),
                telemetryTiredegree()
            ];
        };

        startDashboard();

        return () => {
            stopped = true;

            if (retryTimer !== null) {
                clearTimeout(retryTimer);
            }

            cleanupFunctions.forEach((cleanup) => {
                cleanup();
            });
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
                            carstatus={can0}
                            tps={tps}
                            steeringhandle={
                                steeringhandle
                            }
                            tiredegree={tiredegree}
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