import "./BatteryStatusPanel.css"

function BatteryStatusPaneel({ battery }) {

    return (
        <div className="battery-panel">
            <div className="battery-row">
                <div className="batterty-row-title">
                    <div className="metric-label">
                        배터리 전압
                    </div>

                    <div className="battery-value">
                        {Math.round(battery * 10) / 10}
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

            </div>
        </div>
    )

}

export default BatteryStatusPaneel