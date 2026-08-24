import "./MiniLineChart.css";

function MiniLineChart({
    data,
    color = "blue",
    min = -150,
    max = 150,

}) {
    const width = 300;
    const height = 75;
    const maxLength = 40;

    const emptyCount = maxLength - data.length;

    const points = data
        .map((value, index) => {
            const slotIndex = emptyCount + index;

            const x = (slotIndex / (maxLength - 1)) * width;
            const y =
                height -
                ((value - min) / (max - min)) * height;

            return `${x},${y}`;
        })
        .join(" ");

    return (
        <div className="chart-wrapper">
            <svg
                className="mini-line-chart"
                viewBox={`0 0 ${width} ${height}`}
            >
                <line
                    x1="0"
                    y1="40"
                    x2={width}
                    y2="40"
                    className="chart-zero-line"
                />


                <text x="4" y="7" className="chart-label">
                    {max}
                </text>

                <text x="4" y="40" className="chart-label">
                    {(min + max) / 2}
                </text>

                <text x="4" y="70" className="chart-label">
                    {min}
                </text>

                {data.length >= 2 && (
                    <polyline
                        points={points}
                        fill="none"
                        stroke={`var(--${color})`}
                        strokeWidth="2"
                    />
                )}
            </svg>
        </div>
    );
}

export default MiniLineChart;