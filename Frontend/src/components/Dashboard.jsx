import { useEffect, useState, useRef } from "react";
import PowerStatusPanel from "./panels/PowerStatusPanel/PowerStatusPannel_for_mqtt";
import SpeedStatusPanel from "./panels/SpeedStatusPanel/SpeedStatusPannel_for_mqtt"
import YawRatePanel from "./panels/YawRateRanel/YawRatepannel_for_mqtt"
import BatteryStatusPaneel from "./panels/BatteryStatusPanel/BatteryStatusPannel_for_mqtt"
import RollRatePannel from "./panels/RollRateStatusPannel/RollRateStatusPannel_for_mqtt"
import CarStatusPannel from "./panels/CarStatusPannel/CarStatusPannel_for_mqtt"
import RaceButton from "./panels/RaceControlButton/Button"
import Timer from "./common/Timer/Timer"
import RpmPannel from "./panels/RpmStatusPannel/RpmStatusPannel";
import GpsMaPPannel from "./panels/GpsMapPannel/GpsMapPannel_for_Mqtt"

import "./Dashboard.css";

const CAN0_TIME = 1000000
const TPS_TIME = 1000000
const BPS_TIME = 1000000
const DESIRED_YAWRATE_TIME = 1000000
const GPS_TIME = 1000000

function Dashboard(){
const[can0, setCan0] = useState({
        "latest" : {
            'avg_rpm': 0.0,
            'avg_voltage': 0.0,
            "avg_power": 0.0,   

            "power_right": 0.0,
            "power_left": 0.0,

            "speed": 0.0,

            "current_left": 0.0,
            "current_right": 0.0,
            
            "rpm_left": 0.0,
            "rpm_right": 0.0
        },
        
        "history" : {
            "current_right" : [],
            "current_left" : [],
            "avg_power" : []
        },

        "version" : 0
    })

    const [tps, setTps] = useState({
        "latest" : 0.0,
        "history" : [],
        "version" : 0
    })
    const[bps, setBps] = useState({
        "latest" : 0.0,
        "history" : [],
        "version" : 0
    })
    const[desired_yawrate, setDesiredy_yawrate] = useState({
        "latest" : 0.0,
        "history" : [],
        "version" : 0
    })

    const[gps, setGps] = useState({
        "latest" : {
            "timestamp" : 0.0,
            "latitude" : 0.0,
            "longitude" : 0.0
        },
        "history" : [],
        "version" : 0
    })

    const [racestart, setRacestart] = useState({
        start: false,
        reset: false
    })

    const [elapsedMs, setElapsedMs] = useState(0);

    const can0version = useRef(0)
    const tpsversion = useRef(0)
    const bpsversion = useRef(0)
    const desiredyawrateversion = useRef(0)
    const gpsversion = useRef(0)

    function telemetryCan0() {

        const timer = setInterval(async () => {
            try {
                const response = await fetch(
                    "http://localhost:8000/telemetry/can0"
                );

                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }

                const data = await response.json();

                if(data["version"] === can0version.current){
                    return
                }

                setCan0(data);
                can0version.current = data["version"]
        
            } catch (error) {
                setError(error.message);
            }
        }, CAN0_TIME);

        return () => {
            clearInterval(timer);
        };
    }

    function telemetryTps(){
        const timer = setInterval(async () => {
            try {
                const response = await fetch(
                    "http://localhost:8000/telemetry/tps"
                );

                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }

                const data = await response.json();
                
                if(data["version"] === tpsversion){
                    return;
                }

                setTps(data);
                tpsversion.current = data["version"]
            } catch (error) {
                setError(error.message);
            }
        }, TPS_TIME);

        return () => {
            clearInterval(timer);
        };
    }

    function telemetryBps() {
        const timer = setInterval(async () => {
            try {
                const response = await fetch(
                    "http://localhost:8000/telemetry/bps"
                );

                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }

                const data = await response.json();

                if(data["version"] === bpsversion){
                    return
                }

                setBps(data);
                bpsversion.current = data['version']
                
            } catch (error) {
                setError(error.message);
            }
        }, BPS_TIME);

        return () => {
            clearInterval(timer);
        };
    }

    function telemetryDesiredyawrate() {
        const timer = setInterval(async () => {
            try {
                const response = await fetch(
                    "http://localhost:8000/telemetry/desired-yawrate"
                );

                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }

                const data = await response.json();

                if(data["version"] === desiredyawrateversion){
                    return
                }

                setDesiredy_yawrate(data);
                desiredyawrateversion.current = data['version']

            } catch (error) {
                setError(error.message);
            }
        }, DESIRED_YAWRATE_TIME);

        return () => {
            clearInterval(timer);
        };
    }

    function telemetryGps() {
        const timer = setInterval(async () => {
            try {
                const response = await fetch(
                    "http://localhost:8000/telemetry/gps"
                );

                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }

                const data = await response.json();

                if(data["version"] === gpsversion){
                    return
                }

                setGps(data);
                gps.current = data['version']

            } catch (error) {
                setError(error.message);
            }
        }, GPS_TIME);

        return () => {
            clearInterval(timer);
        };
    }

    useEffect(() => {
        const stopCan0Telemetry = telemetryCan0()
        const stopTpsTelemetry = telemetryTps()
        const stopBpsTelemetry = telemetryBps()
        const stopDesiredyawrateTelemetry = telemetryDesiredyawrate()
        const stopGpsTelemetry = telemetryGps()
        

        return(() => {
            stopCan0Telemetry()
            stopTpsTelemetry()
            stopBpsTelemetry()
            stopDesiredyawrateTelemetry()
            stopGpsTelemetry()
        })
    },[])

    async function fetchButton() {
        try {
            //주행 전(false false)

            //주행 시작 버튼 등장(false false)
            //주행 시작 버튼 눌림(true false)

            //주행 종료 버튼 등장(true false)
            //주행 종료 버튼 눌림(false true)

            //초기화 버튼 등장(false true)
            //초기화 버튼 눌림(false false)

            //주행 시작 버튼 등장(false, false)

            if (racestart.start == false) {
                if (racestart.reset == false) {
                    //false, false
                    const response = await fetch("http://localhost:8000/racestartbutton")
                    setRacestart((prev) => {
                        return {
                            ...prev,
                            start: !prev.start
                            //true false
                        }
                    })
                }
                else {
                    //false, true
                    const response = await fetch("http://localhost:8000/raceresetbutton")
                    setRacestart((prev) => {
                        return {
                            ...prev,
                            reset: !prev.reset
                            //false false
                        }
                    })
                }
            }
            else {
                if (racestart.reset == false) {
                    //true false
                    const response = await fetch("http://localhost:8000/racestopbutton")
                    setRacestart((prev) => {
                        return {
                            start: !prev.start,
                            reset: !prev.reset
                            //false true
                        }
                    })

                }
            }
        }
        catch (err) {
            setError(err.message)
        }
        finally {
            setLoading(false)
        }

    }

    return (
        <div className="dashboard-page">
            <div className={racestart.start ? "race-start-dashboard-header" : racestart.reset ? "race-reset-dashboard-header" : "dashboard-header"}>
                <Timer state={racestart} elapsedMs={elapsedMs} setElapsedMs={setElapsedMs} />
            </div>
            <div className="dashboard-page-pannel">
                <div className="dashboard-page-top">

                    <div className="powerstatus-panel">
                        <PowerStatusPanel can0={can0} />
                    </div>
                    <div className="gpsmap-pannel">
                        <GpsMaPPannel gps= {gps}/>
                    </div>
                    <div className="speedstatus-battery-pannel">
                        <div className="speedstatus-pannel">
                            <SpeedStatusPanel speed={can0["speed"]} />
                        </div>
                        <div className="battery-pannel">
                            <BatteryStatusPaneel battery={50} />
                        </div>
                    </div>

                </div>

                <div className="dashboard-page-bottom">

                    <div className="yawrate-rollrate-pannel">
                        <div className="yawrate-pannel">
                            <YawRatePanel yawRate={desired_yawrate} desiredyawRate={desired_yawrate} />
                        </div>
                        <div className="rollrate-pannel">
                            <RollRatePannel RollRate={desired_yawrate} />
                        </div>
                    </div>
                    <div className="rpmstatus-pannel">
                        <RpmPannel rpm_left={can0["rpm_left"]} rpm_right={can0["rpm_right"]} />
                    </div>
                    <div className="carstatus-pannel">
                        <CarStatusPannel carstatus={can0} />
                    </div>

                </div>

            </div>

            <div className="dashboard-page-footer">
                <RaceButton onClick={fetchButton} text={racestart.start ? "주행종료" : racestart.reset ? "초기화" : "주행 시작"} state={racestart} />
            </div>
        </div>
    );
}

export default Dashboard