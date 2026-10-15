const BlurCircle = ({top = "auto",left ="auto",right="auto",bottom="auto"}) =>{
    return(
        <div className="pointer-events-none absolute z-0 h-58 w-58 aspect-square rounded-full bg-primary/30 blur-3xl" 
         style={{top: top , left:left , right:right , bottom:bottom}}>

        </div>
    )
}

export default BlurCircle