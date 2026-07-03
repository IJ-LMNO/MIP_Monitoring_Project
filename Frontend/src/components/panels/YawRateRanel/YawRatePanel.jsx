import MiniLineChart from "../../common/MiniLineChart";

function YawRatePanel({ yawRate, desiredYawRate }) {
    return (
        <div className="yaw-rate-panel">

            <MiniLineChart
                title="YAW RATE (deg/s)"
                data = {yawRate}
                yMin={-100}
                yMax={100}
            />
            <MiniLineChart
                title="YAW RATE (deg/s)"
                data = {desiredYawRate}
                yMin={-100}
                yMax={100}
            />

        </div>
    );
}

export default YawRatePanel;