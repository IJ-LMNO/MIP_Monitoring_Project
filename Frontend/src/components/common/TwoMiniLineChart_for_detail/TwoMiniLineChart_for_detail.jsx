import { useState } from "react";
import "./TwoMiniLineChart_for_detail.css";

function TwoMiniLineChart_for_detail({
    yawrate = [],
    desiredyawrate = [],
    color = "#3b82f6",
    desiredColor = "#ef4444",
    min = -100,
    max = 100,
    setMouseoveridx,
    setMouseovertimestamp
}) {

    //--------------------------------------------------------------------------------------
    // 기본 설정
    //--------------------------------------------------------------------------------------
    const ORIGINAL_WIDTH = 300;
    const ORIGINAL_HEIGHT = 75;
    const maxLength = 2400; // 20Hz * 120초

    const visibleYawrate = yawrate.slice(-maxLength);
    const visibleDesiredYawrate = desiredyawrate.slice(-maxLength);

    // yawrate / desiredyawrate는 같은 CAN1 시간축
    const emptyCount = maxLength - visibleYawrate.length;

    const [viewBox, setViewBox] = useState({
        x: 0,
        y: 0,
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT
    });


    //--------------------------------------------------------------------------------------
    // timestamp + yawrate 좌표 생성
    //--------------------------------------------------------------------------------------
    const timestamparr = [];
    let prevTimestamp = null;

    const yawratePoints = visibleYawrate.map((value, index) => {
        if (!value || !Array.isArray(value)) return "";

        const slotIndex = emptyCount + index;
        const pointX = (slotIndex / (maxLength - 1)) * ORIGINAL_WIDTH;
        const pointY = ORIGINAL_HEIGHT - ((value[0] - min) / (max - min)) * ORIGINAL_HEIGHT;

        if (value[1]) {
            const currentTimestamp = value[1].split("T")[1]?.split(".")[0];

            if (currentTimestamp && prevTimestamp !== currentTimestamp) {
                timestamparr.push([index, currentTimestamp]);
                prevTimestamp = currentTimestamp;
            }
        }

        return `${pointX},${pointY}`;
    }).join(" ");


    //--------------------------------------------------------------------------------------
    // desired yawrate 좌표 생성
    //--------------------------------------------------------------------------------------
    const desiredYawratePoints = visibleDesiredYawrate.map((value, index) => {
        if (!value || !Array.isArray(value)) return "";

        const slotIndex = emptyCount + index;
        const pointX = (slotIndex / (maxLength - 1)) * ORIGINAL_WIDTH;
        const pointY = ORIGINAL_HEIGHT - ((value[0] - min) / (max - min)) * ORIGINAL_HEIGHT;

        return `${pointX},${pointY}`;
    }).join(" ");


    //--------------------------------------------------------------------------------------
    // 확대 / 축소
    //--------------------------------------------------------------------------------------
    const handleMouseWheel = (event) => {
        event.preventDefault();

        if (visibleYawrate.length === 0 && visibleDesiredYawrate.length === 0) return;

        const scale = Math.exp(event.deltaY * 0.001);

        let minPointX = Infinity;
        let maxPointX = -Infinity;
        let minPointY = Infinity;
        let maxPointY = -Infinity;


        // yawrate 영역
        visibleYawrate.forEach((value, index) => {
            if (!value || !Array.isArray(value)) return;

            const slotIndex = emptyCount + index;
            const pointX = (slotIndex / (maxLength - 1)) * ORIGINAL_WIDTH;
            const pointY = ORIGINAL_HEIGHT - ((value[0] - min) / (max - min)) * ORIGINAL_HEIGHT;

            minPointX = Math.min(minPointX, pointX);
            maxPointX = Math.max(maxPointX, pointX);
            minPointY = Math.min(minPointY, pointY);
            maxPointY = Math.max(maxPointY, pointY);
        });


        // desired yawrate 영역
        visibleDesiredYawrate.forEach((value, index) => {
            if (!value || !Array.isArray(value)) return;

            const slotIndex = emptyCount + index;
            const pointX = (slotIndex / (maxLength - 1)) * ORIGINAL_WIDTH;
            const pointY = ORIGINAL_HEIGHT - ((value[0] - min) / (max - min)) * ORIGINAL_HEIGHT;

            minPointX = Math.min(minPointX, pointX);
            maxPointX = Math.max(maxPointX, pointX);
            minPointY = Math.min(minPointY, pointY);
            maxPointY = Math.max(maxPointY, pointY);
        });


        if (!Number.isFinite(minPointX) || !Number.isFinite(minPointY)) return;

        const dataCenterX = (minPointX + maxPointX) / 2;
        const dataCenterY = (minPointY + maxPointY) / 2;

        const originalCenterX = ORIGINAL_WIDTH / 2;
        const originalCenterY = ORIGINAL_HEIGHT / 2;


        setViewBox((prev) => {
            let newWidth = prev.width * scale;
            let newHeight = prev.height * scale;

            const currentCenterX = prev.x + prev.width / 2;
            const currentCenterY = prev.y + prev.height / 2;


            // 확대
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


            // 축소
            newWidth = Math.min(newWidth, ORIGINAL_WIDTH);
            newHeight = Math.min(newHeight, ORIGINAL_HEIGHT);

            if (newWidth >= ORIGINAL_WIDTH || newHeight >= ORIGINAL_HEIGHT) {
                return {
                    x: 0,
                    y: 0,
                    width: ORIGINAL_WIDTH,
                    height: ORIGINAL_HEIGHT
                };
            }

            const restoreRatio = (newWidth - prev.width) / (ORIGINAL_WIDTH - prev.width);

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
    // 마우스 위치 → 배열 index / timestamp
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


        setMouseoveridx(() => {
            return{
                "idx" : idx
            }
        });


        // 현재 idx가 어느 초 구간에 있는지 확인
        let timestampFound = false;

        for (let i = 0; i < timestamparr.length - 1; i++) {
            if (timestamparr[i][0] <= idx && idx < timestamparr[i + 1][0]) {
                setMouseovertimestamp({
                    first_timestamp: timestamparr[i][1],
                    last_timestamp: timestamparr[i + 1][1]
                });

                timestampFound = true;
                break;
            }
        }


        // 해당 timestamp 구간이 없을 경우 이전 값이 남지 않게 초기화
        if (!timestampFound) {
            setMouseovertimestamp({
                first_timestamp: null,
                last_timestamp: null
            });
        }
    };


    //--------------------------------------------------------------------------------------
    // 마우스가 그래프 밖으로 나감
    //--------------------------------------------------------------------------------------
    const handleMouseLeave = () => {
        setMouseoveridx({ idx: null });

        setMouseovertimestamp({
            first_timestamp: null,
            last_timestamp: null
        });
    };


    //--------------------------------------------------------------------------------------
    // 현재 viewBox 기준 Y축 값
    //--------------------------------------------------------------------------------------
    const visibleMax = Math.round(
        min + ((ORIGINAL_HEIGHT - viewBox.y) / ORIGINAL_HEIGHT) * (max - min)
    );

    const visibleMin = Math.round(
        min + ((ORIGINAL_HEIGHT - (viewBox.y + viewBox.height)) / ORIGINAL_HEIGHT) * (max - min)
    );

    const visibleMiddle = Math.round((visibleMax + visibleMin) / 2);

    const zoom = ORIGINAL_WIDTH / viewBox.width;
    const fontSize = 10 / zoom;

    const centerY = viewBox.y + viewBox.height / 2;


    //--------------------------------------------------------------------------------------
    // render
    //--------------------------------------------------------------------------------------
    return (
        <div className="tchart-wrapper-for-detail">
            <svg
                className="tmini-line-chart-for-detail"
                viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                preserveAspectRatio="none"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onWheel={handleMouseWheel}
            >

                {/* 가운데 기준선 */}
                <line
                    x1={viewBox.x}
                    y1={centerY}
                    x2={viewBox.x + viewBox.width}
                    y2={centerY}
                    className="tchart-zero-line-for-detail"
                    vectorEffect="non-scaling-stroke"
                />


                {/* 최대값 */}
                <text
                    x={viewBox.x + viewBox.width * (4 / ORIGINAL_WIDTH)}
                    y={viewBox.y + viewBox.height * (12 / ORIGINAL_HEIGHT)}
                    className="tchart-label-for-detail"
                    style={{ fontSize }}
                >
                    {visibleMax}
                </text>


                {/* 중간값 */}
                <text
                    x={viewBox.x + viewBox.width * (4 / ORIGINAL_WIDTH)}
                    y={viewBox.y + viewBox.height * (39 / ORIGINAL_HEIGHT)}
                    className="tchart-label-for-detail"
                    style={{ fontSize }}
                >
                    {visibleMiddle}
                </text>


                {/* 최소값 */}
                <text
                    x={viewBox.x + viewBox.width * (4 / ORIGINAL_WIDTH)}
                    y={viewBox.y + viewBox.height * (66 / ORIGINAL_HEIGHT)}
                    className="tchart-label-for-detail"
                    style={{ fontSize }}
                >
                    {visibleMin}
                </text>


                {/* yawrate */}
                {visibleYawrate.length >= 2 && (
                    <polyline
                        points={yawratePoints}
                        fill="none"
                        stroke={color}
                        strokeWidth="0.1"
                    />
                )}


                {/* desired yawrate */}
                {visibleDesiredYawrate.length >= 2 && (
                    <polyline
                        points={desiredYawratePoints}
                        fill="none"
                        stroke={desiredColor}
                        strokeWidth="0.1"
                    />
                )}

            </svg>
        </div>
    );
}

export default TwoMiniLineChart_for_detail;