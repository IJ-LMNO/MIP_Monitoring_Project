import { useEffect, useState, useRef } from "react";
import PowerStatusPanel from "./components/panels/PowerStatusPanel/PowerStatusPanel_for_mqtt";
import SpeedStatusPanel from "./components/panels/SpeedStatusPanel/SpeedStatusPanel"
import YawRatePanel from "./components/panels/YawRateRanel/YawRatePanel"
import BatteryStatusPaneel from "./components/panels/BatteryStatusPanel/BatteryStatusPanel"
import RollRatePannel from "./components/panels/RollRateStatusPannel/RollRateStatusPannel"
import CarStatusPannel from "./components/panels/CarStatusPannel/CarStatusPannel"
import RaceButton from "./components/panels/RaceControlButton/Button"
import Timer from "./components/common/Timer/Timer"
import RpmPannel from "./components/panels/RpmStatusPannel/RpmStatusPannel";

import "./components/Dashboard.css";

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

    const [tps, setTps] = useState(0.0)
    const[bps, setBps] = useState(0.0)
    const[desired_yawrate, setDesiredy_yawrate] = useState(0.00)

    const [racestart, setRacestart] = useState({
        start: false,
        reset: false
    })

    const [elapsedMs, setElapsedMs] = useState(0);

    const can0version = useRef(0)
    const tpsversion = useRef(0)
    const bpsversion = useRef(0)
    const desiredyawrateversion = useRef(0)

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
        }, 100);

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
        }, 100);

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
        }, 100);

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
        }, 100);

        return () => {
            clearInterval(timer);
        };
    }

    useEffect(() => {
        const stopCan0Telemetry = telemetryCan0()
        const stopTpsTelemetry = telemetryTps()
        const stopBpsTelemetry = telemetryBps()
        const stopDesiredyawrateTelemetry = telemetryDesiredyawrate()

        return(() => {
            stopCan0Telemetry()
            stopTpsTelemetry()
            stopBpsTelemetry()
            stopDesiredyawrateTelemetry()
        })
    },[])

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
                    <div className="speedstatus-battery-pannel">
                        <div className="speedstatus-pannel">
                            <SpeedStatusPanel speed={can0["speed"]} />
                        </div>
                        <div className="battery-pannel">
                            <BatteryStatusPaneel battery={battery} />
                        </div>
                    </div>

                </div>

                <div className="dashboard-page-bottom">

                    <div className="yawrate-rollrate-pannel">
                        <div className="yawrate-pannel">
                            <YawRatePanel yawRate={yawrate} desiredyawRate={desiredyawrate} />
                        </div>
                        <div className="rollrate-pannel">
                            <RollRatePannel RollRate={rollrate} />
                        </div>
                    </div>
                    <div className="rpmstatus-pannel">
                        <RpmPannel />
                    </div>
                    <div className="carstatus-pannel">
                        <CarStatusPannel carstatus={carstatus} />
                    </div>

                </div>

            </div>

            <div className="dashboard-page-footer">
                <RaceButton onClick={fetchButton} text={racestart.start ? "주행종료" : racestart.reset ? "초기화" : "주행 시작"} state={racestart} />
                {/* <MyButton text="None" /> */}
                {/* <MyButton text="None" />
                    <MyButton text="None" />
                    <MyButton text="None" />
                    <MyButton text="None" /> */}
            </div>
        </div>
    );
}

export default Dashboard