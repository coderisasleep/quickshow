import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const Loading = () =>{

    const {nextUrl} = useParams()
    const navigate = useNavigate()

    useEffect(()=>{
        if(!nextUrl){
            return
        }

        const timeoutId = setTimeout(()=>{
            navigate('/'+nextUrl)
        },8000)

        return () => clearTimeout(timeoutId)
    },[navigate,nextUrl])


    return(
        <div className="flex justify-center items-center min-h-screen" role="status" aria-label="Loading">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-600 border-t-primary"></div>
        </div>
    )
}

export default Loading