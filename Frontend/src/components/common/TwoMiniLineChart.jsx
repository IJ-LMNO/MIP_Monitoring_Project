function TwoMiniLineChart({
    yawrate,
    desiredyawrate,
    color = "#3b82f6",
    desiredColor = "#ef4444",
    min = -100,
    max = 100
}) {
    const width = 300;
    const height = 70;

    const makePoints = (arr) => {
        return arr
            .map((value, index) => {
                const x = (index / (arr.length - 1)) * width;
                const y = height - ((value - min) / (max - min)) * height;

                return `${x},${y}`;
            })
            .join(" ");
    };

    const yawratePoints = makePoints(yawrate);
    const desiredYawratePoints = makePoints(desiredyawrate);

    return (
        <svg className="mini-line-chart" width = "50%" height = "50%" viewBox={`0 0 ${width} ${height}`}>
            <line
                x1="0"
                y1="35"
                x2={width}
                y2="35"
                className="chart-zero-line"
            />

            <text x="4" y="12" className="chart-label">
                {max}
            </text>

            <text x="4" y="39" className="chart-label">
                0
            </text>

            <text x="4" y="66" className="chart-label">
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
    );
}

export default TwoMiniLineChart;