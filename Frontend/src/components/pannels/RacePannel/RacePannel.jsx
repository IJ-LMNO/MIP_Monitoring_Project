import "./RacePannel.css"

function RacePannel({ button }) {

    const make_pannel = () => {
        return button["history"].map((value, index) => {
            return (
                <div
                    className="race-rap-pannel"
                    key={index}
                >
                    {value[0]}
                </div>
            )
        })
    }

    return (
        <div className="race-pannel-row">
            {make_pannel()}
        </div>
    )
}

export default RacePannel