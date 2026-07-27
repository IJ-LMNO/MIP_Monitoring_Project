import "./DropdownMenu.css"

function DropdownMenu({latest_race_download}) {
    return (
        <div className="dropdown">
            <button className="dropdown-button">
                <span className="dropdown-line line-top"></span>
                <span className="dropdown-line line-middle"></span>
                <span className="dropdown-line line-bottom"></span>
                <span className="dropdown-dot"></span>
            </button>

            <div className="dropdown-menu">
                <button onClick={latest_race_download}>이전 주행 다운로드</button>
                <button>이전 주행 불러오기(구현 예정)</button>
                <button>설정(구현 예정)</button>
            </div>
        </div>
    );
}

export default DropdownMenu;
