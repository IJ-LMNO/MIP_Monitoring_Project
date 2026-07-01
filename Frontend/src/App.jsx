import { useEffect, useState } from "react";
import PowerStatusPanel from "./components/panels/PowerStatusPanel";
import "./styles/dashboard.css";

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
        batteryVoltage: 58,
        soc: 95,

        series: {
            currentLeft: createSeries(40, 78, 180),
            currentRight: createSeries(40, 80, 180),
            powerKw: createSeries(40, 9, 8),
        },
    });

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

        }, 500);

        return () => clearInterval(timer);

    }, []);

    return (
        <div className="dashboard-test-page">
            <PowerStatusPanel telemetry={telemetry} />
        </div>
    );
}

export default App;
