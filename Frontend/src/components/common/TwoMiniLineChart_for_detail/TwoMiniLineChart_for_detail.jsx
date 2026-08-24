import "./TwoMiniLineChart_for_detail.css"

function TwoMiniLineChart_for_detail({
    yawrate= [],
    desiredyawrate = [],
    color = "#3b82f6",
    desiredColor = "#ef4444",
    min = -100,
    max = 100,
    len = 9000
}) {
    const width = 300;
    const height = 75;
    const maxLength = len;

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
        <div className="tchart-wrapper-for-detail">
            <svg
                className="tmini-line-chart-for-detail"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="None"
            >
                <line
                    x1="0"
                    y1={height / 2}
                    x2={width}
                    y2={height / 2}
                    className="tchart-zero-line-for-detail"
                />

                <text x="4" y="12" className="tchart-label-for-detail">
                    {max}
                </text>

                <text
                    x="4"
                    y={height / 2 + 4}
                    className="tchart-label-for-detail"
                >
                    0
                </text>

                <text x="4" y={height - 4} className="tchart-label-for-detail">
                    {min}
                </text>

                <polyline
                    points={yawratePoints}
                    fill="none"
                    stroke={color}
                    strokeWidth="0.1"
                />

                <polyline
                    points={desiredYawratePoints}
                    fill="none"
                    stroke={desiredColor}
                    strokeWidth="0.1"
                />
            </svg>
        </div>
    );
}

export default TwoMiniLineChart_for_detail;