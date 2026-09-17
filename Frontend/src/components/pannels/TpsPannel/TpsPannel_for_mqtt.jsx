import "./TpsPannel.css";

function TpsGauge({ label, value, max = 100, colorClass }) {
    const safeValue = Math.min(Math.max(value, 0), max);
    const percentage = (safeValue / max) * 100;

    const segments = 10;

    return (
        <div className="tps-gauge">
            <div className="tps-title">{label}</div>
            <div className="tps-value">{Math.ceil(value)}</div>

            <div className="tps-meter-area">
                <div className="tps-bar-frame">
                    <div
                        className={`tps-bar-fill ${colorClass}`}
                        style={{ height: `${percentage}%` }}
                    />

                    <div className="tps-segments">
                        {Array.from({ length: segments }).map((_, index) => (
                            <span key={index} />
                        ))}
                    </div>
                </div>

                <div className="tps-scale">
                    <div className="tps-scale-item scale-5000">
                        <span className="tps-scale-line" />
                        <span>100</span>
                    </div>

                    <div className="tps-scale-item scale-4000">
                        <span className="tps-scale-line" />
                        <span>80</span>
                    </div>

                    <div className="tps-scale-item scale-3000">
                        <span className="tps-scale-line" />
                        <span>60</span>
                    </div>

                    <div className="tps-scale-item scale-2000">
                        <span className="tps-scale-line" />
                        <span>40</span>
                    </div>

                    <div className="tps-scale-item scale-1000">
                        <span className="tps-scale-line" />
                        <span>20</span>
                    </div>

                    <div className="tps-scale-item scale-bottom">
                        <span className="tps-scale-line" />
                        <span>0</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TpsPannel({tps}) {
    return (
        <div className="tps-pannel">

            <TpsGauge
                label="Tps"
                value={tps}
                colorClass="tps-fill"
            />

        </div>
    );
}

export default TpsPannel;