import MiniLineChart from "../../common/MinLineChart/MiniLineChart"

import "./RollRateStatusPannel.css"

function RollRateStatusPannel({ RollRate }) {
    return (
        <div className="rollrate-pannel-row">
            <div className="rollrate-chart">
                <MiniLineChart
                    data={RollRate["history"]}
                    min={-10}
                    max={10}
                />
            </div>
            <div className="rollrate-text">
                RollRate
                <div className="rollrate-value">
                   {Math.round(RollRate["latest"] * 100) / 100}
                </div>

            </div>
        </div>
    )
}

export default RollRateStatusPannel