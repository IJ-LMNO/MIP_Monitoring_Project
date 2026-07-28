import { useNavigate } from "react-router";

import TwoMiniLineChart from "../../common/TwoMiniLineChart/TwoMiniLineChart_for_mqtt";
import "./YawRatePanel.css"

function YawRatePanel({ yawRate, desiredyawRate }) {
    const currentyawrate = yawRate["latest"]
    const currentdesiredyawrate = desiredyawRate["latest"]
    const navigate = useNavigate();

    const handleOpenDetail = () => {
        window.open("/graph/yawrate", "_blank");
    };


    return (
        <div className="yawrate-pannel">

            <div className="yawrate-pannel-header">
                <button onClick={handleOpenDetail}>
                    +
                </button>
            </div>

            <div className="yawrate-pannel-body">
                <div className="yawrate-pannel-chart">
                    <TwoMiniLineChart
                        yawrate={yawRate["history"]}
                        desiredyawrate={desiredyawRate["history"]}
                        min={-100}
                        max={100}
                    />
                </div>

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
            </div>
        </div>
    );
}

export default YawRatePanel;