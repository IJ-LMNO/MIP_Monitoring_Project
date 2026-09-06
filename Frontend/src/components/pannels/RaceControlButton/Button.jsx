import "./Button.css"

function MyButton({onClick, text, state}){
    return(
        <div className="button">
            <button className = {state.start ? "race-stop-button" : state.reset ? "race-reset-button" : "race-start-button"} onClick={onClick}>{text}</button>
        </div>
    )
}

export default MyButton