import MiniLineChart from "../../common/MinLineChart/MiniLineChart_for_mqtt"

import "./RollRateStatusPannel.css"

function RollRateStatusPannel({ RollRate }) {
    return (
        <div className="rollrate-pannel-row">
            <div className="rollrate-text">
                RollRate
                <div className="rollrate-value">
                    {RollRate["latest"]}
                </div>

            </div>
            <div className="rollrate-chart">
                <MiniLineChart
                    data={RollRate["history"]}
                    min={-100}
                    max={100}
                />
            </div>
        </div>
    )
}

export default RollRateStatusPannel