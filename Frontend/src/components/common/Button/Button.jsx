import "./Button.css"

function Button({onClick, text}){
    return(
        <div className="button">
            <button width = "100%" height = "100%" onClick={onClick}>{text}</button>
        </div>
    )
}

export default Button