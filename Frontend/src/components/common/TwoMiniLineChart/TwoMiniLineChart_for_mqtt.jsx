import "./TwoMiniLineChart.css";

function TwoMiniLineChart({
    yawrate= [],
    desiredyawrate = [],
    color = "#3b82f6",
    desiredColor = "#ef4444",
    min = -100,
    max = 100
}) {
    const width = 300;
    const height = 75;
    const maxLength = 40;

    const makePoints = (data) => {
        const visibleData = data.slice(-maxLength);
        const emptyCount = maxLength - visibleData.length;

        return visibleData
            .map((value, index) => {
                const slotIndex = emptyCount + index;

                const x =
                    (slotIndex / (maxLength - 1)) * width;

                const y =
                    height -
                    ((value - min) / (max - min)) * height;

                return `${x},${y}`;
            })
            .join(" ");
    };

    const yawratePoints = makePoints(yawrate);
    const desiredYawratePoints = makePoints(desiredyawrate);

    return (
        <div className="chart-wrapper">
            <svg
                className="mini-line-chart"
                width="100%"
                height="60%"
                viewBox={`0 0 ${width} ${height}`}
            >
                <line
                    x1="0"
                    y1={height / 2}
                    x2={width}
                    y2={height / 2}
                    className="chart-zero-line"
                />

                <text x="4" y="12" className="chart-label">
                    {max}
                </text>

                <text
                    x="4"
                    y={height / 2 + 4}
                    className="chart-label"
                >
                    0
                </text>

                <text x="4" y={height - 4} className="chart-label">
                    {min}
                </text>

                <polyline
                    points={yawratePoints}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                />

                <polyline
                    points={desiredYawratePoints}
                    fill="none"
                    stroke={desiredColor}
                    strokeWidth="2"
                />
            </svg>
        </div>
    );
}

export default TwoMiniLineChart;