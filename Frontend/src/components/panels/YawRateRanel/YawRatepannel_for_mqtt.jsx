import TwoMiniLineChart from "../../common/TwoMiniLineChart/TwoMiniLineChart_for_mqtt";
import "./YawRatePanel.css"

function YawRatePanel({ yawRate, desiredyawRate }) {
    const currentyawrate = yawRate["latest"]
    const currentdesiredyawrate = desiredyawRate["latest"]

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
                    yawrate={yawRate["history"]}
                    desiredyawrate={desiredyawRate["history"]}
                    min={-100}
                    max={100}
                />

            </div>
        </div>
    );
}

export default YawRatePanel;