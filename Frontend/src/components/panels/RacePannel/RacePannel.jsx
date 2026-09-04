import "./RacePannel.css"

function RacePannel({ record }) {

    const make_pannel = () => {
        return record.map((value, index) => {
            return (
                <div
                    className="race-rap-pannel"
                    key={index}
                >

                </div>
            )
        })
    }

    return (
        <div className="race-pannel-row">
            {/* {make_pannel()} */}
        </div>
    )
}

export default RacePannel