import MiniLineChart from "../../common/MinLineChart/MiniLineChart_for_mqtt";

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
                    {value}
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
                    label="전류 L"
                    value={can0["latest"]["current_left"]}
                    unit="A"
                    color="blue"
                    chartData={can0["history"]["current_left"]}
                />
            </div>
            <div className="power-status-panel">
                <PowerMetricRow
                    label="전류 R"
                    value={can0["latest"]["current_right"]}
                    unit="A"
                    color="red"
                    chartData={can0["history"]["current_right"]}
                />
            </div>
            <div className="power-status-panel">
                <PowerMetricRow
                    label="출력"
                    value={can0["latest"]["avg_power"]}
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