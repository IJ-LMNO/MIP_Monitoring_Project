import MiniLineChart from "../../common/MiniLineChart"

import "./RollRateStatusPannel.css"

function RollRateStatusPannel({RollRate}){
    return(
        <div className="rollrate-pannel-row">
            {/* <div className="rollrate">
                RollRate
                <div className="rollrate-value">
                    {RollRate.value}
                </div>

            </div> */}
            <div className="rollrate-chart">
                <MiniLineChart
                    data={RollRate.rollratearr}
                    min={-100}
                    max={100}
                />
            </div>
        </div>
    )
}

export default RollRateStatusPannel