import { useEffect, useState } from "react";
import "./MiniLineChart_for_detail.css"

function MiniLineChart({
    data, // ca0["history"]["current left /right /avg_power"][value, timestamp]
    color = "blue", // 색으로 지정 된 타입
    min = -150, //
    max = 150, //
    setMouseoveridx, // 
    setMouseovertimestamp // 
}) {

    //--------------------------------------------------------------------------------------
    // viewbox에 대한 초기화 값
    //--------------------------------------------------------------------------------------- 
    const width = 300;
    const height = 75;
    const maxLength = 6000;
    const emptyCount = maxLength - data.length;


    //--------------------------------------------------------------------------------------
    // Can0의 current left/right 그리고 avg_power의 각 데이터의 인덱스와 timestamp를 저장
    //  -> gps가 1초마다 들어오기 떄문에 저장된 이전 시간(prevTimestmap)와 비교해 다를 경우 배열에 push
    //  -> gps와 Can0 데이터를 하나로 묶기 위한 교집합 데이터는 timestan=mp
    //  -> 해당 배열에 있는 데이터는 이전 시간(prevTimestmap)과 다른 timestamp를 가지고 있는 첫번째 can0["history"]의 데이터에 대한 인덱스와 timestamp
    // timestamparr = [(can0 ["history"]의 특정 데이터에 대한) 인덱스, (can0 ["history"]의 특정 데이터에 대한) timestamp]
    // timestamp.arr = 0 : PowerDetailPage 랜더링시 MiniLinechart function 전체가 한줄씩 실행되므로 이전 데이터를 지우고 배열 초기화
    //--------------------------------------------------------------------------------------- 
    const timestamparr = []
    timestamparr.length = 0


    //--------------------------------------------------------------------------------------
    // Gps가 들어온 이전 시간을 저장
    // Gps 데이터는 1초마다 한 번씩 들어오기 때문에 이전 timestamp를 기록해, timestamp가 변화했는지 파악
    //  -> CAN0의 Timstamp를 이용해 기록(timestamp 변화시 )
    //--------------------------------------------------------------------------------------- 
    let prevTimestamp = null


    //--------------------------------------------------------------------------------------
    // PowerStatusDetail이 새로 렌더링 되면서 드러온 data를 원하는 구조의 배열로 재생성  : map
    //--------------------------------------------------------------------------------------- 

    const points = data
        .map((value, index) => {
            const slotIndex = emptyCount + index;

            const x = (slotIndex / (maxLength - 1)) * width;

            const y =
                height -
                ((value[0] - min) / (max - min)) * height;

            if (prevTimestamp != value[1].split("T")[1].split(".")[0]){
                timestamparr.push([index, value[1].split("T")[1].split(".")[0]])

                prevTimestamp = value[1].split("T")[1].split(".")[0]
            }

            return `${x},${y}`;
        })
        .join(" ");



    //--------------------------------------------------------------------------------------
    // 차트위에 마우스가 올라가는 이벤트 발생시 실행되는 event handler
    //---------------------------------------------------------------------------------------
    const handleMouseMove = (event) => {
        const svg = event.currentTarget
        const rect = svg.getBoundingClientRect()
        const mouseX = ((event.clientX - rect.left) / rect.width) * width


        const idx = Math.round((mouseX / width) * (maxLength - 1)) - emptyCount
        
        for(let i = 0; i < timestamparr.length -1; i++){
            if(timestamparr[i][0] <= idx && idx <= timestamparr[i+1][0])
                setMouseovertimestamp(()=>{
                    return{
                        "first_timestamp" : timestamparr[i][1],
                        "last_timestamp" : timestamparr[i+1][1]
                    }
                })
        }

        setMouseoveridx(() => {
            return{
                "type" : color,
                "idx": idx
            }
        })
    };


    //--------------------------------------------------------------------------------------
    // 차트위에서 마우스가 내려가는 이벤트 발생시 실행되는 event handler
    //---------------------------------------------------------------------------------------
    const handleMouseLeave = (event) => {
        setMouseoveridx(() => {
            return {
                "type": null,
                "idx": null
            }
        })

        setMouseovertimestamp(()=>{
            return{
                "first_timestamp" : null,
                "last_timestamp" : null
            }
        })
    }



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

                {/*{timestamp.map((value) => {
                    const signX =
                        ((emptyCount + value) / (maxLength - 1)) * width;

                    return (
                        <line
                            key={value[0]}
                            x1={signX}
                            y1="0"
                            x2={signX}
                            y2={height}
                            strokeWidth={0.3}
                            className="detail-chart-zero-line"
                        />
                    );
                })}*/}

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