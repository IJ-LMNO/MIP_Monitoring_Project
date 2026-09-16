import { useState, useRef } from "react";
import "./MiniLineChart_for_detail.css";

function MiniLineChart({
    data,
    color = "blue",
    min = -150,
    max = 150,
    setMouseoveridx,
    setMouseovertimestamp,
    strokeWidth = 0.1,
    stopsiginal,
    setStopsignal,
    maxlen
}) {

    //--------------------------------------------------------------------------------------
    // 고정 SVG 좌표계
    //--------------------------------------------------------------------------------------
    const ORIGINAL_WIDTH = 300;
    const ORIGINAL_HEIGHT = 75;
    const maxLength = maxlen;


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
    // 그래프 정지용 이전 데이터
    //--------------------------------------------------------------------------------------
    const prevData = useRef([]);


    //--------------------------------------------------------------------------------------
    // 이번 렌더에서 실제 사용할 데이터 결정
    // 실행 중 -> 최신 data 사용 + snapshot 갱신
    // 정지 중 -> 마지막 snapshot 사용
    //--------------------------------------------------------------------------------------
    let targetData = data;

    if (stopsiginal.state === true) {
        targetData = prevData.current;
    }
    else {
        prevData.current = data;
    }


    //--------------------------------------------------------------------------------------
    // 현재 실제 표시되는 데이터 기준으로 빈 영역 계산
    //--------------------------------------------------------------------------------------
    const emptyCount = maxLength - targetData.length;


    //--------------------------------------------------------------------------------------
    // timestamp 배열
    //--------------------------------------------------------------------------------------
    const timestamparr = [];
    let prevTimestamp = null;


    //--------------------------------------------------------------------------------------
    // 실제 그래프 좌표 생성
    //--------------------------------------------------------------------------------------
    const points = targetData.map((value, index) => {
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
    // 마우스 위치 → 데이터 index / 드래그 이동
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
        if (idx < 0 || idx >= targetData.length) {
            setMouseoveridx({
                type: null,
                idx: null
            });

            setMouseovertimestamp({
                first_timestamp: null,
                last_timestamp: null,
                cutoff_timestamp : null,
            });

            return;
        }


        for (let i = 0; i < timestamparr.length - 1; i++) {
            if (timestamparr[i][0] <= idx && idx <= timestamparr[i + 1][0]) {
                setMouseovertimestamp({
                    first_timestamp: timestamparr[i][1],
                    last_timestamp: timestamparr[i + 1][1],
                });

                break;
            }
        }

        setMouseovertimestamp((prev) => {
            return{
                ...prev,
                cutoff_timestamp : timestamparr[timestamparr.length - 1][1]
            }
        })


        setMouseoveridx({
            type: color,
            idx: idx
        });

        setStopsignal((prev) => {
            return{
                ...prev,
                "data": prevData.current
            }
        })
    };


    //--------------------------------------------------------------------------------------
    // Wheel 확대 / 축소
    //--------------------------------------------------------------------------------------
    const handleMouseWheel = (event) => {
        event.preventDefault();

        if (targetData.length === 0) return;

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
            type: null,
            idx: null
        });

        setMouseovertimestamp({
            first_timestamp: null,
            last_timestamp: null,
            cutoff_timestamp : null
        });
    };


    //--------------------------------------------------------------------------------------
    // 마우스 up
    //--------------------------------------------------------------------------------------
    const handleMouseUp = () => {
        dragRef.current.isDragging = false;
    };


    //--------------------------------------------------------------------------------------
    // 현재 viewBox가 보여주는 Y 데이터 범위
    //--------------------------------------------------------------------------------------
    const visibleMax = Math.round(min + ((ORIGINAL_HEIGHT - viewBox.y) / ORIGINAL_HEIGHT) * (max - min));
    const visibleMin = Math.round(min + ((ORIGINAL_HEIGHT - (viewBox.y + viewBox.height)) / ORIGINAL_HEIGHT) * (max - min));
    const visibleMiddle = Math.round((visibleMax + visibleMin) / 2);

    const zoom = ORIGINAL_WIDTH / viewBox.width;
    const fontSize = 10 / zoom;
    const centerY = viewBox.y + viewBox.height / 2;


    return (
        <div className="detail-chart-wrapper">
            <svg
                className="detail-chart-line-chart"
                viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
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
                {targetData.length >= 2 && (
                    <polyline
                        points={points}
                        fill="none"
                        stroke={`var(--${color})`}
                        strokeWidth={strokeWidth}
                    />
                )}

            </svg>
        </div>
    );
}

export default MiniLineChart;