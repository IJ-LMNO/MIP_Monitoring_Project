import MiniLineChart from "../../common/MinLineChart/MiniLineChart";

import "./PowerStatusPanel.css";

function PowerMetricRow({
    label,
    value,
    unit,
    color,
    chartData,
    min = -150,
    max = 150,
}) {
    return (
        <div className="power-metric-row">
            <div className="power-metric-text">
                <div className={`metric-label ${color}`}>{label}</div>

                <div className={`metric-main-value ${color}`}>
                    {Math.round((value /1) * 10) / 10 }
                    <span>{unit}</span>
                </div>
            </div>
            <div className="minlinechart-row">
                <MiniLineChart
                    data={chartData}
                    color={color}
                    min={min}
                    max={max}
                />
            </div>
        </div>
    );
}

function PowerStatusPanel({ can0 }) {
    return (
        <div className="power-status-pannels">
            <div className="power-status-panel">
                <PowerMetricRow
                    label="Current L"
                    value={Math.round((can0["latest"]["current_left"]) * 10) / 10}
                    // unit="A"
                    color="blue"
                    chartData={can0["history"]["current_left"]}
                    min={0}
                    max = {100}
                />
            </div>
            <div className="power-status-panel">
                <PowerMetricRow
                    label="Current R"
                    value={Math.round((can0["latest"]["current_right"]) * 10) / 10}
                    // unit="A"
                    color="red"
                    chartData={can0["history"]["current_right"]}
                    min={0}
                    max={100}
                />
            </div>
            <div className="power-status-panel">
                <PowerMetricRow
                    label="Power"
                    value={Math.round((can0["latest"]["avg_power"] / 1000) * 10) / 10}
                    unit="kW"
                    color="green"
                    chartData={can0["history"]["avg_power"]}
                    min={0}
                    max={15}
                />

            </div>
        </div>
    );
}

export default PowerStatusPanel;