import { useState, useRef } from "react";
import "./TwoMiniLineChart_for_detail.css";

function TwoMiniLineChart_for_detail({
    yawrate = [],
    desiredyawrate = [],
    color = "#3b82f6",
    desiredColor = "#ef4444",
    min = -100,
    max = 100,
    setMouseoveridx,
    setMouseovertimestamp,
    strokewidth,
    stopsiginal,
    setStopsignal,
    maxlen

}) {

    //--------------------------------------------------------------------------------------
    // 기본 설정
    //--------------------------------------------------------------------------------------
    const ORIGINAL_WIDTH = 300;
    const ORIGINAL_HEIGHT = 75;
    const maxLength = maxlen;

    const visibleYawrate = yawrate;
    const visibleDesiredYawrate = desiredyawrate;


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
    // 드래그 상태
    //--------------------------------------------------------------------------------------
    const dragRef = useRef({
        isDragging: false,
        startClientX: 0,
        startClientY: 0,
        startX: 0,
        startY: 0,
        startWidth: ORIGINAL_WIDTH,
        startHeight: ORIGINAL_HEIGHT
    });


    //--------------------------------------------------------------------------------------
    // 정지 시 사용할 이전 데이터 저장
    //--------------------------------------------------------------------------------------
    const preYawrateData = useRef([]);
    const preDesiredYawrateData = useRef([]);


    //--------------------------------------------------------------------------------------
    // 현재 렌더에서 실제 사용할 데이터 결정
    //
    // 실행 중 -> 최신 데이터 사용 + ref 갱신
    // 정지 중 -> ref에 저장된 마지막 snapshot 사용
    //--------------------------------------------------------------------------------------
    let targetYawrateData = visibleYawrate;
    let targetDesiredYawrateData = visibleDesiredYawrate;

    if (stopsiginal.state === true) {
        targetYawrateData = preYawrateData.current;
        targetDesiredYawrateData = preDesiredYawrateData.current;
    }
    else {
        preYawrateData.current = visibleYawrate;
        preDesiredYawrateData.current = visibleDesiredYawrate;
    }


    //--------------------------------------------------------------------------------------
    // 반드시 현재 화면에 실제 표시되는 데이터 기준으로 emptyCount 계산
    //--------------------------------------------------------------------------------------
    const emptyCount = maxLength - targetYawrateData.length;


    //--------------------------------------------------------------------------------------
    // timestamp + yawrate 좌표 생성
    //--------------------------------------------------------------------------------------
    const timestamparr = [];
    let prevTimestamp = null;

    const yawratePoints = targetYawrateData.map((value, index) => {
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
    const desiredYawratePoints = targetDesiredYawrateData.map((value, index) => {
        const slotIndex = emptyCount + index;
        const pointX = (slotIndex / (maxLength - 1)) * ORIGINAL_WIDTH;
        const pointY = ORIGINAL_HEIGHT - ((value[0] - min) / (max - min)) * ORIGINAL_HEIGHT;

        return `${pointX},${pointY}`;
    }).join(" ");


    //--------------------------------------------------------------------------------------
    // 드래그 시작
    //--------------------------------------------------------------------------------------
    const handleMouseDown = (event) => {
        if (event.button !== 0) return;
        if (viewBox.width >= ORIGINAL_WIDTH && viewBox.height >= ORIGINAL_HEIGHT) return;

        dragRef.current = {
            isDragging: true,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startX: viewBox.x,
            startY: viewBox.y,
            startWidth: viewBox.width,
            startHeight: viewBox.height
        };
    };


    //--------------------------------------------------------------------------------------
    // 마우스 위치 → 배열 index / 드래그 이동
    //--------------------------------------------------------------------------------------
    const handleMouseMove = (event) => {

        //----------------------------------------------------------------------------------
        // 드래그 중
        //----------------------------------------------------------------------------------
        if (dragRef.current.isDragging) {
            const svg = event.currentTarget;
            const rect = svg.getBoundingClientRect();

            const deltaClientX = event.clientX - dragRef.current.startClientX;
            const deltaClientY = event.clientY - dragRef.current.startClientY;

            const deltaSvgX = deltaClientX * (dragRef.current.startWidth / rect.width);
            const deltaSvgY = deltaClientY * (dragRef.current.startHeight / rect.height);

            let newX = dragRef.current.startX - deltaSvgX;
            let newY = dragRef.current.startY - deltaSvgY;

            const maxX = ORIGINAL_WIDTH - dragRef.current.startWidth;
            const maxY = ORIGINAL_HEIGHT - dragRef.current.startHeight;

            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            setViewBox((prev) => {
                return {
                    ...prev,
                    x: newX,
                    y: newY
                };
            });

            return;
        }


        //----------------------------------------------------------------------------------
        // 일반 hover
        //----------------------------------------------------------------------------------
        const svg = event.currentTarget;
        const point = svg.createSVGPoint();

        point.x = event.clientX;
        point.y = event.clientY;

        const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
        const mouseX = svgPoint.x;

        const slotIndex = Math.round((mouseX / ORIGINAL_WIDTH) * (maxLength - 1));
        const idx = slotIndex - emptyCount;


        // 데이터가 없는 영역
        if (idx < 0 || idx >= targetYawrateData.length) {
            setMouseoveridx({ idx: null });

            setMouseovertimestamp({
                first_timestamp: null,
                last_timestamp: null,
                cutoff_timestamp : null
            });

            return;
        }


        setMouseoveridx({
            idx: idx
        });


        for (let i = 0; i < timestamparr.length - 1; i++) {
            if (timestamparr[i][0] <= idx && idx < timestamparr[i + 1][0]) {
                setMouseovertimestamp({
                    first_timestamp: timestamparr[i][1],
                    last_timestamp: timestamparr[i + 1][1]
                });

                break;
            }
        }

        setMouseovertimestamp((prev) => {
            return {
                ...prev,
                cutoff_timestamp: timestamparr[timestamparr.length - 1][1]
            }
        })

        setStopsignal((prev) => {
            return{
                ...prev,
                "yawrate" : preYawrateData.current,
                "desired_yawrate" : preDesiredYawrateData.current
            }
        })

    };


    //--------------------------------------------------------------------------------------
    // 드래그 종료
    //--------------------------------------------------------------------------------------
    const handleMouseUp = () => {
        dragRef.current.isDragging = false;
    };


    //--------------------------------------------------------------------------------------
    // Wheel 확대 / 축소
    // 마우스 커서 위치 기준 확대
    //--------------------------------------------------------------------------------------
    const handleMouseWheel = (event) => {
        event.preventDefault();

        if (targetYawrateData.length === 0 && targetDesiredYawrateData.length === 0) return;

        const svg = event.currentTarget;
        const point = svg.createSVGPoint();

        point.x = event.clientX;
        point.y = event.clientY;

        const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
        const mouseX = svgPoint.x;
        const mouseY = svgPoint.y;

        const scale = Math.exp(event.deltaY * 0.001);

        setViewBox((prev) => {
            let newWidth = prev.width * scale;
            let newHeight = prev.height * scale;

            if (newWidth >= ORIGINAL_WIDTH || newHeight >= ORIGINAL_HEIGHT) {
                return {
                    x: 0,
                    y: 0,
                    width: ORIGINAL_WIDTH,
                    height: ORIGINAL_HEIGHT
                };
            }

            const mouseRatioX = (mouseX - prev.x) / prev.width;
            const mouseRatioY = (mouseY - prev.y) / prev.height;

            let newX = mouseX - mouseRatioX * newWidth;
            let newY = mouseY - mouseRatioY * newHeight;

            const maxX = ORIGINAL_WIDTH - newWidth;
            const maxY = ORIGINAL_HEIGHT - newHeight;

            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            return {
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight
            };
        });
    };


    //--------------------------------------------------------------------------------------
    // 마우스 leave
    //--------------------------------------------------------------------------------------
    const handleMouseLeave = () => {
        dragRef.current.isDragging = false;

        setMouseoveridx({
            idx: null
        });

        setMouseovertimestamp({
            first_timestamp: null,
            last_timestamp: null,
            cutoff_timestamp : null
        });
    };


    //--------------------------------------------------------------------------------------
    // 현재 viewBox 기준 Y축 값
    //--------------------------------------------------------------------------------------
    const visibleMax = Math.round(min + ((ORIGINAL_HEIGHT - viewBox.y) / ORIGINAL_HEIGHT) * (max - min));
    const visibleMin = Math.round(min + ((ORIGINAL_HEIGHT - (viewBox.y + viewBox.height)) / ORIGINAL_HEIGHT) * (max - min));
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
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
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
                {targetYawrateData.length >= 2 && (
                    <polyline
                        points={yawratePoints}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokewidth}
                    />
                )}


                {/* desired yawrate */}
                {targetDesiredYawrateData.length >= 2 && (
                    <polyline
                        points={desiredYawratePoints}
                        fill="none"
                        stroke={desiredColor}
                        strokeWidth={strokewidth}
                    />
                )}

            </svg>
        </div>
    );
}

export default TwoMiniLineChart_for_detail;