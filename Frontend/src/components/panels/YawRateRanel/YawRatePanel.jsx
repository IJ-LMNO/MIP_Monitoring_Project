import TwoMiniLineChart from "../../common/TwoMiniLineChart";
import MiniLineChart from "../../common/TwoMiniLineChart";

import "./YawRatePanel.css"

function YawRatePanel({ yawRate, desiredyawRate }) {
    const currentyawrate = yawRate.series.yawratearr.slice(-1)
    const currentdesiredyawrate = desiredyawRate.series.desiredyawratearr.slice(-1)

    return (
        <div className="yawrate-pannel-row">
            <div className="yawrate-pannel-text">
                <div className="YawRATE">
                    YawRATE
                    <div className="YawRATE-value">
                        {currentyawrate}
                    </div>
                </div>
                <div className="DesiredYawRATE">
                    DesiredYawRATE
                    <div className="DesiredYawRATE-value">
                        {currentdesiredyawrate}
                    </div>
                </div>
            </div>

            <div className="yawrate-pannel-chart">
                <TwoMiniLineChart
                    yawrate={yawRate.series.yawratearr}
                    desiredyawrate={desiredyawRate.series.desiredyawratearr}
                    min={-100}
                    max={100}
                />

            </div>
        </div>
    );
}

export default YawRatePanel;