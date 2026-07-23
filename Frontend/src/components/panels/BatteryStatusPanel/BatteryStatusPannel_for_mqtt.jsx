import "./BatteryStatusPanel.css"

function BatteryStatusPaneel({ battery }) {

    return (
        <div className="battery-panel">
            <div className="battery-row">
                <div>
                    <div className="metric-label">
                        배터리 전압
                    </div>

                    <div className="battery-value">
                        {battery}
                        <span>V</span>
                    </div>
                </div>

                <div className="soc-area">
                    <div className="soc-title">
                        SOC
                    </div>

                    <div className="soc-bar">
                        <div
                            className="soc-fill"
                            style={{
                                width: `${battery}%`
                            }}
                        />
                    </div>
                </div>

                <div className="soc-value">
                    {battery}%
                </div>

            </div>
        </div>
    )

}

export default BatteryStatusPaneel