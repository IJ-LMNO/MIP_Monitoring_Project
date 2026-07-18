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

function PowerStatusPanel({ telemetry }) {
    return (
        <div className="power-status-pannels">
            <div className="power-status-panel">
                <PowerMetricRow
                    label="전류 L"
                    value={telemetry.currentLeft}
                    unit="A"
                    color="blue"
                    chartData={telemetry.series.currentLeft}
                />
            </div>
            <div className="power-status-panel">
                <PowerMetricRow
                    label="전류 R"
                    value={telemetry.currentRight}
                    unit="A"
                    color="red"
                    chartData={telemetry.series.currentRight}
                />
            </div>
            <div className="power-status-panel">
                <PowerMetricRow
                    label="출력"
                    value={telemetry.powerKw}
                    unit="kW"
                    color="green"
                    chartData={telemetry.series.powerKw}
                    min={0}
                    max={15}
                />

            </div>
        </div>
    );
}

export default PowerStatusPanel;