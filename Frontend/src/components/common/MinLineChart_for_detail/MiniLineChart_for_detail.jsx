import { useEffect, useState } from "react";
import "./MiniLineChart_for_detail.css"

function MiniLineChart({
    data,
    color = "blue",
    min = -150,
    max = 150,
    setIdx,
    gpstimestamp,
    setCan0FirstLast
}) {

    const timestampidx = []
    
    const width = 300;
    const height = 75;
    const maxLength = 6000;

    const emptyCount = maxLength - data.length;

    const points = data
        .map((value, index) => {
            const slotIndex = emptyCount + index;

            const x = (slotIndex / (maxLength - 1)) * width;

            const y =
                height -
                ((value[0] - min) / (max - min)) * height;

            if (gpstimestamp != value[1].split("T")[1].split(".")[0]){
                timestampidx.push([index, value[1].split("T")[1].split(".")[0]])
            }

            return `${x},${y}`;
        })
        .join(" ");


    const handleMouseMove = (event) => {
        const svg = event.currentTarget
        const rect = svg.getBoundingClientRect()
        const mouseX = ((event.clientX - rect.left) / rect.width) * width

        const idx = Math.round((mouseX / width) * (maxLength - 1)) - emptyCount
        for(let i = 0; i < timestampidx.length -1; i++){
            if(timestampidx[i][0] <= idx && idx <= timestampidx[i+1][0])
                setCan0FirstLast(()=>{
                    return{
                        "first_timestamp" : timestampidx[i][1],
                        "last_timestamp" : timestampidx[i+1][1]
                    }
                })
        }

        setIdx(() => {
            return{
                "type" : color,
                "idx": idx
            }
        })
    };

    const handleMouseLeave = (event) => {
        setIdx(() => {
            return {
                "type": null,
                "idx": null
            }
        })
    }

    // const [timestampindex, setTimestampindex] = useState({});
    useEffect(() => {
        if (!gpstimestamp || gpstimestamp == null) {
            return;
        }

        let prevgpstimestamp = null
        if(prevgpstimestamp != gpstimestamp){
            prevgpstimestamp = gpstimestamp
        }
        else{

        }


        setSignIndexes((prev) => [...prev, sign.idx]);

        setSign((prev) => ({
            ...prev,
            sign: false
        }));
    }, []);

    return (
        <div className="detail-chart-wrapper">
            <svg
                className="detail-chart-line-chart"
                viewBox={`0 0 ${width} ${height}`}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <line
                    x1="0"
                    y1="35"
                    x2={width}
                    y2="35"
                    className="detail-chart-zero-line"
                />

                {timestampidx.map((idx) => {
                    const signX =
                        ((emptyCount + idx) / (maxLength - 1)) * width;

                    return (
                        <line
                            key={idx}
                            x1={signX}
                            y1="0"
                            x2={signX}
                            y2={height}
                            className="detail-chart-zero-line"
                        />
                    );
                })}

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