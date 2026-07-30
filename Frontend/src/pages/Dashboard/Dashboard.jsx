import { useEffect, useState } from "react";

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

const CAN0_TIME = 100;
const CAN1_TIME = 100;
const GPS_TIME = 200;

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

    function startTelemetry(endpoint, setter, intervalTime) {
        const fetchTelemetry = async () => {
            try {
                const response = await fetch(
                    `${API_BASE_URL}${endpoint}`
                );

                if (!response.ok) {
                    throw new Error(
                        `${endpoint} 요청 실패: ${response.status}`
                    );
                }

                const data = await response.json();

                setter(data);
                setError(null);
            } catch (error) {
                console.error(error);
                setError(error.message);
            }
        };

        // 화면 진입 직후 한 번 실행
        fetchTelemetry();

        // 이후 주기적으로 실행
        const timer = setInterval(fetchTelemetry, intervalTime);

        return () => {
            clearInterval(timer);
        };
    }

    function telemetryCan0() {
        return startTelemetry(
            "/telemetry/can0",
            setCan0,
            CAN0_TIME
        );
    }

    function telemetryTps() {
        return startTelemetry(
            "/telemetry/tps",
            setTps,
            CAN1_TIME
        );
    }

    function telemetryDesiredYawrate() {
        return startTelemetry(
            "/telemetry/desired-yawrate",
            setDesiredYawrate,
            CAN1_TIME
        );
    }

    function telemetryGps() {
        return startTelemetry(
            "/telemetry/gps",
            setGps,
            GPS_TIME
        );
    }

    function telemetryYawrate() {
        return startTelemetry(
            "/telemetry/yawrate",
            setYawrate,
            CAN1_TIME
        );
    }

    function telemetryRollrate() {
        return startTelemetry(
            "/telemetry/rollrate",
            setRollrate,
            CAN1_TIME
        );
    }

    function telemetrySteeringhandle() {
        return startTelemetry(
            "/telemetry/steeringhandle",
            setSteeringhandle,
            CAN1_TIME
        );
    }

    function telemetryTiredegree() {
        return startTelemetry(
            "/telemetry/tiredegree",
            setTireDegree,
            CAN1_TIME
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

    useEffect(() => {
        const stopCan0Telemetry = telemetryCan0();
        const stopTpsTelemetry = telemetryTps();
        const stopDesiredYawrateTelemetry =
            telemetryDesiredYawrate();
        const stopGpsTelemetry = telemetryGps();

        const stopYawrateTelemetry = telemetryYawrate();
        const stopRollrateTelemetry = telemetryRollrate();
        const stopSteeringhandleTelemetry =
            telemetrySteeringhandle();
        const stopTiredegreeTelemetry =
            telemetryTiredegree();

        return () => {
            stopCan0Telemetry();
            stopTpsTelemetry();
            stopDesiredYawrateTelemetry();
            stopGpsTelemetry();

            stopYawrateTelemetry();
            stopRollrateTelemetry();
            stopSteeringhandleTelemetry();
            stopTiredegreeTelemetry();
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