import TwoMiniLineChart from "../../common/TwoMiniLineChart";
import MiniLineChart from "../../common/TwoMiniLineChart";

const width = "100%"
const height = "100%"


function YawRatePanel({ yawRate, desiredyawRate }) {
    return (
        <div className="yaw-rate-panel">
            <TwoMiniLineChart
                yawrate = {yawRate.series.yawratearr}
                desiredyawrate={desiredyawRate.series.desiredyawratearr}
                min={-100}
                max={100}
            />

        </div>
    );
}

export default YawRatePanel;