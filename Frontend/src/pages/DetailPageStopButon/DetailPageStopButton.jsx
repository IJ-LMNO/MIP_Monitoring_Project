import "./DetailPageStopButton.css"

function StopButton({ stopsiginal, setStopsiginal }){

    const onclick = () => {
        if(stopsiginal["state"] == true){
            console.log("팔랑귀 팔랑귀 red red")
            setStopsiginal(() => {
                return{
                    "state" : false,
                    "color" : "red",
                    "text" : "Stop!"
                }
            })
        }
        else{
            setStopsiginal(() => {
                return {
                    "state": true,
                    "color": "white",
                    "text": "Go!"
                }
            })
        }

    }

    return(
        <div className="stop-button-pannel">
            <button className="stop-button" onClick={onclick} style={{ backgroundColor: stopsiginal["color"] }}>{stopsiginal["text"]}</button>
        </div>
    )
}

export default StopButton