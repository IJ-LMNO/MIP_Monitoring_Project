import "./DropdownMenu.css"

function DropdownMenu() {
    const handleClick = (sensor) => {
        window.open("/detail/" + sensor, "_blank");
    };

    return (
        <div className="dropdown">
            <button className="dropdown-button">
                <span className="dropdown-line line-top"></span>
                <span className="dropdown-line line-middle"></span>
                <span className="dropdown-line line-bottom"></span>
                <span className="dropdown-dot"></span>
            </button>

            <div className="dropdown-menu">
                <button onClick={() => handleClick("powerstatus")}>
                    powerstatus 상세보기
                </button>

                <button onClick={() => handleClick("yawrate")}>
                    yawrate 상세보기
                </button>

                <button onClick={() => handleClick("rollrate")}>
                    rollrate 상세보기
                </button>

                <button>설정</button>
            </div>
        </div>
    );
}

export default DropdownMenu
