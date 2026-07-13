import "./Button.css"

function MyButton({onClick, text}){
    return(
        <div className="button">
            <button onClick={onClick}>{text}</button>
        </div>
    )
}

export default MyButton