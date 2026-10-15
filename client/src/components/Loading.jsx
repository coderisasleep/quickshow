const Loading = () =>{
    return(
        <div className="flex justify-center items-center min-h-screen" role="status" aria-label="Loading">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-600 border-t-primary"></div>
        </div>
    )
}

export default Loading