function MiniLineChart({ data, color = "blue", min = -150, max = 150 }) {
    const width = 300;
    const height = 70;

    const points = data
        .map((value, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - ((value - min) / (max - min)) * height;

            return `${x},${y}`;
        })
        .join(" ");

    return (
        <svg className="mini-line-chart" viewBox={`0 0 ${width} ${height}`}>
            <line x1="0" y1="35" x2={width} y2="35" className="chart-zero-line" />

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
                points={points}
                fill="none"
                stroke={`var(--${color})`}
                strokeWidth="2"
            />
        </svg>
    );
}

export default MiniLineChart;