import { useEffect, useState } from "react";
import PowerStatusPanel from "./components/panels/PowerStatusPanel/PowerStatusPanel";
import SpeedStatusPanel from"./components/panels/SpeedStatusPanel/SpeedStatusPanel"
import YawRatePanel from "./components/panels/YawRateRanel/YawRatePanel"
import BatteryStatusPaneel from "./components/panels/BatteryStatusPanel/BatteryStatusPanel";

import"./components/dashboard.css";


function createSeries(length, base, noise) {
    return Array.from({ length }, () => {
        return Math.round(base + (Math.random() - 0.5) * noise);
    });
}

function App() {

    const [telemetry, setTelemetry] = useState({
        currentLeft: 78,
        currentRight: 80,
        powerKw: 9,

        series: {
            currentLeft: createSeries(40, 78, 180),
            currentRight: createSeries(40, 80, 180),
            powerKw: createSeries(40, 9, 8),
        },
    });
    const [speed, setSpeed] = useState(0)

    const [loading, setLoading] = useState(false)

    const [yawrate, setYawRate] = useState({
        currentyawrate : 0,

        series : {
            yawratearr : createSeries(40,0,100)
        }
    })

    const [battery, setBattery] = useState({
        soc : 95,
        batteryVoltage : 95
    })

    const [desiredyawrate, setDesiredyawrate] = useState({
        currentdesiredyawrate: 0,

        series: {
            desiredyawratearr: createSeries(40, 0, 100)
        }
    })

    useEffect(() => {

        const timer = setInterval(() => {

            setTelemetry((prev) => {

                const nextCurrentLeft =
                    Math.round(78 + (Math.random() - 0.5) * 120);

                const nextCurrentRight =
                    Math.round(80 + (Math.random() - 0.5) * 120);

                const nextPowerKw =
                    Math.max(
                        0,
                        Math.round(9 + (Math.random() - 0.5) * 6)
                    );

                return {

                    ...prev,

                    currentLeft: nextCurrentLeft,
                    currentRight: nextCurrentRight,
                    powerKw: nextPowerKw,

                    batteryVoltage: 58,
                    soc: 95,

                    series: {

                        currentLeft: [
                            ...prev.series.currentLeft.slice(1),
                            nextCurrentLeft,
                        ],

                        currentRight: [
                            ...prev.series.currentRight.slice(1),
                            nextCurrentRight,
                        ],

                        powerKw: [
                            ...prev.series.powerKw.slice(1),
                            nextPowerKw,
                        ],
                    },
                };
            });

        }, 10000);

        return () => clearInterval(timer);

    }, []);

    useEffect(() => {

        const timer = setInterval(() => {
    
            const nextspeed = Math.round(Math.random() * 100)
            setSpeed(nextspeed)

        }, 10000)

        return () => clearInterval(timer)

    },[])

    useEffect(() => {

        const timer = setInterval(() => {
    
            setYawRate((prev) => {
                const nextyawrate = Math.round(Math.random() * 100)

                return ({
                    ...prev,

                    currentyawrate : nextyawrate,

                    series :{
                        ...prev.series,

                        yawratearr :[
                            ...prev.series.yawratearr.slice(1),
                            nextyawrate
                        ]
                    }

                })
            })

        }, 1000)

        return () => clearInterval(timer)

    },[])

    useEffect(() => {

        const timer = setInterval(() => {

            setDesiredyawrate((prev) => {
                const nextdesiredyawrate = Math.round(Math.random() * 100)

                return ({
                    ...prev,

                    currentdesiredyawrate: nextdesiredyawrate,

                    series: {
                        ...prev.series,

                        desiredyawratearr: [
                            ...prev.series.desiredyawratearr.slice(1),
                            nextdesiredyawrate
                        ]
                    }

                })
            })

        }, 1000)

        return () => clearInterval(timer)

    }, [])


    useEffect(() => {
        async function fetchTelemetry() {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch("http://localhost:8000/dashboard");

            if (!response.ok) {
            throw new Error("서버 응답 오류");
            }

            const data = await response.json();

            setTelemetry(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
        }

        fetchTelemetry();
    }, []);


    async function fetchButton() {
            try{
                const response = await fetch("http://localhost:8000/button")   
            }
            catch(err){
                setError(err.message)
            }
            finally{
                setLoading(false)
            }
            
    }


    return (

        <div className="dashboard-page">
            <div className="dashboard-page-top">
                <div className="powerstatus-panel">
                    <PowerStatusPanel telemetry={telemetry} />
                </div>
                <div className="speedstatus-panel">
                    <SpeedStatusPanel speed={speed} />  
                    <BatteryStatusPaneel battery={battery}/>
                </div>
            </div>
            <div className="dashboard-page-bottom">
                <div className="yawrate-pannel">
                    <YawRatePanel yawRate={yawrate} desiredyawRate={desiredyawrate}/>  
                </div>
            </div>
        </div>
            

    );

}

export default App;
