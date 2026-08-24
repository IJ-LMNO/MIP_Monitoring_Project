import "./MiniLineChart_for_detail.css"

function MiniLineChart({
    data,
    color = "blue",
    min = -150,
    max = 150
}) {
    const width = 300;
    const height = 75;
    const maxLength = 9000;

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
        <div className="detail-chart-wrapper">
            <svg
                className="detail-chart-line-chart"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
            >
                <line
                    x1="0"
                    y1="35"
                    x2={width}
                    y2="35"
                    className="detail-chart-zero-line"
                />

                <text x="4" y="12" className="detail-chart-label">
                    {max}
                </text>

                <text x="4" y="39" className="detail-chart-label">
                    {(min + max) / 2}
                </text>

                <text x="4" y="66" className="detail-chart-label">
                    {min}
                </text>

                {data.length >= 2 && (
                    <polyline
                        points={points}
                        fill="none"
                        stroke={`var(--${color})`}
                        strokeWidth="0.1"
                    />
                )}
            </svg>
        </div>
    );
}

export default MiniLineChart;