import { useState } from "react";
import "./MiniLineChart_for_detail.css";

function MiniLineChart({
    data,
    color = "blue",
    min = -150,
    max = 150,
    setMouseoveridx,
    setMouseovertimestamp
}) {

    //--------------------------------------------------------------------------------------
    // 고정 SVG 좌표계
    //--------------------------------------------------------------------------------------
    const ORIGINAL_WIDTH = 300;
    const ORIGINAL_HEIGHT = 75;

    const maxLength = 6000;
    const emptyCount = maxLength - data.length;


    //--------------------------------------------------------------------------------------
    // 현재 카메라(viewBox)
    //--------------------------------------------------------------------------------------
    const [viewBox, setViewBox] = useState({
        x: 0,
        y: 0,
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT
    });


    //--------------------------------------------------------------------------------------
    // timestamp 배열
    //--------------------------------------------------------------------------------------
    const timestamparr = [];
    let prevTimestamp = null;


    //--------------------------------------------------------------------------------------
    // 실제 그래프 좌표 생성
    // 좌표계 자체는 항상 300 x 75로 고정
    //--------------------------------------------------------------------------------------
    const points = data.map((value, index) => {
        const slotIndex = emptyCount + index;
        const pointX = (slotIndex / (maxLength - 1)) * ORIGINAL_WIDTH;
        const pointY = ORIGINAL_HEIGHT - ((value[0] - min) / (max - min)) * ORIGINAL_HEIGHT;

        const currentTimestamp = value[1].split("T")[1].split(".")[0];

        if (prevTimestamp !== currentTimestamp) {
            timestamparr.push([index, currentTimestamp]);
            prevTimestamp = currentTimestamp;
        }

        return `${pointX},${pointY}`;
    }).join(" ");


    //--------------------------------------------------------------------------------------
    // 마우스 위치 → 데이터 index
    //--------------------------------------------------------------------------------------
    const handleMouseMove = (event) => {
        const svg = event.currentTarget;
        const point = svg.createSVGPoint();

        point.x = event.clientX;
        point.y = event.clientY;

        const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
        const mouseX = svgPoint.x;

        const slotIndex = Math.round((mouseX / ORIGINAL_WIDTH) * (maxLength - 1));
        const idx = slotIndex - emptyCount;

        for (let i = 0; i < timestamparr.length - 1; i++) {
            if (timestamparr[i][0] <= idx && idx <= timestamparr[i + 1][0]) {
                setMouseovertimestamp(() => {
                    return {
                        first_timestamp: timestamparr[i][1],
                        last_timestamp: timestamparr[i + 1][1]
                    };
                });
            }
        }

        setMouseoveridx(() => {
            return {
                type: color,
                idx: idx
            };
        });
    };


    //--------------------------------------------------------------------------------------
    // Wheel 확대 / 축소
    //
    // 확대:
    // 현재 데이터가 존재하는 중심 방향으로 점진적으로 이동
    //
    // 축소:
    // 원래 SVG 중심으로 점진적으로 복구
    //
    // 최대로 축소:
    // viewBox = 0 0 300 75
    //--------------------------------------------------------------------------------------
    const handleMouseWheel = (event) => {
        event.preventDefault();

        if (data.length === 0) return;

        const scale = Math.exp(event.deltaY * 0.001);

        //----------------------------------------------------------------------------------
        // 현재 데이터가 실제로 존재하는 영역 계산
        //----------------------------------------------------------------------------------
        let minPointX = Infinity;
        let maxPointX = -Infinity;
        let minPointY = Infinity;
        let maxPointY = -Infinity;

        data.forEach((value, index) => {
            const slotIndex = emptyCount + index;
            const pointX = (slotIndex / (maxLength - 1)) * ORIGINAL_WIDTH;
            const pointY = ORIGINAL_HEIGHT - ((value[0] - min) / (max - min)) * ORIGINAL_HEIGHT;

            minPointX = Math.min(minPointX, pointX);
            maxPointX = Math.max(maxPointX, pointX);
            minPointY = Math.min(minPointY, pointY);
            maxPointY = Math.max(maxPointY, pointY);
        });


        //----------------------------------------------------------------------------------
        // 현재 그래프 데이터의 중심
        //----------------------------------------------------------------------------------
        const dataCenterX = (minPointX + maxPointX) / 2;
        const dataCenterY = (minPointY + maxPointY) / 2;


        //----------------------------------------------------------------------------------
        // 원래 화면 중심
        //----------------------------------------------------------------------------------
        const originalCenterX = ORIGINAL_WIDTH / 2;
        const originalCenterY = ORIGINAL_HEIGHT / 2;


        setViewBox((prev) => {
            let newWidth = prev.width * scale;
            let newHeight = prev.height * scale;

            const currentCenterX = prev.x + prev.width / 2;
            const currentCenterY = prev.y + prev.height / 2;


            //------------------------------------------------------------------------------
            // 확대
            //------------------------------------------------------------------------------
            if (scale < 1) {
                const moveRatio = 1 - scale;

                const newCenterX = currentCenterX + (dataCenterX - currentCenterX) * moveRatio;
                const newCenterY = currentCenterY + (dataCenterY - currentCenterY) * moveRatio;

                return {
                    x: newCenterX - newWidth / 2,
                    y: newCenterY - newHeight / 2,
                    width: newWidth,
                    height: newHeight
                };
            }


            //------------------------------------------------------------------------------
            // 축소
            //------------------------------------------------------------------------------
            newWidth = Math.min(newWidth, ORIGINAL_WIDTH);
            newHeight = Math.min(newHeight, ORIGINAL_HEIGHT);


            // 원본 크기로 완전히 돌아오면 초기화
            if (newWidth >= ORIGINAL_WIDTH || newHeight >= ORIGINAL_HEIGHT) {
                return {
                    x: 0,
                    y: 0,
                    width: ORIGINAL_WIDTH,
                    height: ORIGINAL_HEIGHT
                };
            }


            // 현재 확대 상태에서 원본 크기로 얼마나 복구됐는지
            const restoreRatio = (newWidth - prev.width) / (ORIGINAL_WIDTH - prev.width);

            // 원래 화면 중앙 방향으로 복귀
            const newCenterX = currentCenterX + (originalCenterX - currentCenterX) * restoreRatio;
            const newCenterY = currentCenterY + (originalCenterY - currentCenterY) * restoreRatio;

            return {
                x: newCenterX - newWidth / 2,
                y: newCenterY - newHeight / 2,
                width: newWidth,
                height: newHeight
            };
        });
    };


    //--------------------------------------------------------------------------------------
    // 마우스 leave
    //--------------------------------------------------------------------------------------
    const handleMouseLeave = () => {
        setMouseoveridx(() => {
            return {
                type: null,
                idx: null
            };
        });

        setMouseovertimestamp(() => {
            return {
                first_timestamp: null,
                last_timestamp: null
            };
        });
    };


    //--------------------------------------------------------------------------------------
    // 현재 viewBox가 보여주는 Y 데이터 범위
    //--------------------------------------------------------------------------------------
    const visibleMax = Math.round(min + ((ORIGINAL_HEIGHT - viewBox.y) / ORIGINAL_HEIGHT) * (max - min));
    const visibleMin = Math.round(min + ((ORIGINAL_HEIGHT - (viewBox.y + viewBox.height)) / ORIGINAL_HEIGHT) * (max - min));
    const visibleMiddle = Math.round((visibleMax + visibleMin) / 2);


    //--------------------------------------------------------------------------------------
    // 확대해도 글자 크기 일정하게 유지
    //--------------------------------------------------------------------------------------
    const zoom = ORIGINAL_WIDTH / viewBox.width;
    const fontSize = 10 / zoom;


    //--------------------------------------------------------------------------------------
    // 그래프의 가운데 선 기준 좌표계
    //--------------------------------------------------------------------------------------
    const centerY = viewBox.y + viewBox.height / 2;


    return (
        <div className="detail-chart-wrapper">
            <svg
                className="detail-chart-line-chart"
                viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onWheel={handleMouseWheel}
            >

                {/* 실제 0 기준선 */}
                <line
                    x1={0}
                    y1={centerY}
                    x2={ORIGINAL_WIDTH}
                    y2={centerY}
                    className="detail-chart-zero-line"
                    vectorEffect="non-scaling-stroke"
                />


                {/* 현재 화면 최대값 */}
                <text
                    x={viewBox.x + viewBox.width * (4 / ORIGINAL_WIDTH)}
                    y={viewBox.y + viewBox.height * (12 / ORIGINAL_HEIGHT)}
                    className="detail-chart-label"
                    style={{ fontSize }}
                >
                    {visibleMax}
                </text>


                {/* 현재 화면 중간값 */}
                <text
                    x={viewBox.x + viewBox.width * (4 / ORIGINAL_WIDTH)}
                    y={viewBox.y + viewBox.height * (39 / ORIGINAL_HEIGHT)}
                    className="detail-chart-label"
                    style={{ fontSize }}
                >
                    {visibleMiddle}
                </text>


                {/* 현재 화면 최소값 */}
                <text
                    x={viewBox.x + viewBox.width * (4 / ORIGINAL_WIDTH)}
                    y={viewBox.y + viewBox.height * (66 / ORIGINAL_HEIGHT)}
                    className="detail-chart-label"
                    style={{ fontSize }}
                >
                    {visibleMin}
                </text>


                {/* 그래프 */}
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