import { createContext, useEffect, useState, useContext, useMemo } from "react";
import axios from 'axios';
import { useAuth, useUser } from "@clerk/react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export const AppContext = createContext()

export const AppProvider = ({ children }) =>{
    
    const [isAdmin, setIsAdmin] = useState(false)
    const [isLoadingAdmin, setIsLoadingAdmin] = useState(true)
    const [adminCheckError, setAdminCheckError] = useState(null)
    const [shows, setShows] = useState([])
    const [isLoadingShows, setIsLoadingShows] = useState(true)
    const [favouriteMovies,setFavouriteMovies] = useState([])

    const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

    const {user, isLoaded: isUserLoaded} = useUser()
    const {getToken, isLoaded: isAuthLoaded, isSignedIn} = useAuth()
    const api = useMemo(() =>{
      const client = axios.create({baseURL:import.meta.env.VITE_BASE_URL})

      client.interceptors.request.use(async config =>{
        if(!config._clerkRetry && config.headers?.Authorization){
          const token = await getToken()
          if(token){
            config.headers.Authorization = `Bearer ${token}`
          }
        }
        return config
      })

      client.interceptors.response.use(response => response, async error =>{
        const config = error.config
        const hasAuthorization = config?.headers?.Authorization
          || config?.headers?.authorization
        if(error.response?.status !== 401 || !config || !hasAuthorization || config._clerkRetry){
          return Promise.reject(error)
        }

        config._clerkRetry = true
        try{
          const token = await getToken({skipCache:true})
          if(!token){
            return Promise.reject(error)
          }
          config.headers.Authorization = `Bearer ${token}`
          return await client.request(config)
        }catch(refreshError){
          return Promise.reject(refreshError)
        }
      })

      return client
    },[getToken])
    const isClerkLoaded = isUserLoaded && isAuthLoaded
    const location = useLocation()
    const navigate = useNavigate()

    const fetchIsAdmin = async() =>{
        if(!isClerkLoaded || !isSignedIn || !user){
          return
        }

        setIsLoadingAdmin(true)
        setAdminCheckError(null)
        try{
          const token = await getToken()
          if(!token){
            throw new Error('Unable to retrieve authentication token')
          }

          const {data} = await api.get('/api/admin/is-admin',{
            headers:{Authorization:`Bearer ${token}`}
          })
          if(!data.success || data.isAdmin !== true){
            setIsAdmin(false)
            if(location.pathname.startsWith('/admin')){
              navigate('/')
              toast.error(data.message || 'Not authorized to access admin dashboard')
            }
            return
          }

          setIsAdmin(true)
        }catch(error){
          console.error(error)
          setIsAdmin(false)
          setAdminCheckError(
            error.response?.data?.message
              || 'Unable to verify admin access. Check your connection and try again.'
          )
        }finally{
          setIsLoadingAdmin(false)
        }
    }

    const fetchShows = async () =>{
        try{
          const {data} = await api.get('/api/show/all')
          if(data.success){
            setShows(data.shows)
          }else{
            toast.error(data.message)
          }
        }catch(error){
          console.error(error)
        }finally{
          setIsLoadingShows(false)
        }
    }

    const fetchFavouriteMovies = async() =>{
        try{
          const {data} = await api.get('/api/user/favourites',{headers:{Authorization:`Bearer ${await getToken()}`}})

          if(data.success){
            setFavouriteMovies(data.movies)
          }else{
            toast.error(data.message)
          }
        }catch(error){
            console.error(error)
        }
    }

    useEffect(() =>{
        fetchShows()
    },[])

    useEffect(()=>{
        if(!isClerkLoaded){
          return
        }

        if(user){
          fetchIsAdmin()
          fetchFavouriteMovies()
        }else{
          setIsAdmin(false)
          setIsLoadingAdmin(false)
        }
    },[isClerkLoaded,isSignedIn,user,location.pathname])


    const value = { 
        axios:api,
        fetchIsAdmin,
        user,isClerkLoaded,getToken,navigate,isAdmin,isLoadingAdmin,adminCheckError,shows,isLoadingShows,
        fetchShows,
        favouriteMovies,fetchFavouriteMovies,image_base_url
    }
    
    return(
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = () => useContext(AppContext)