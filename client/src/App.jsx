import NavBar from './components/navBar'
import { matchPath, Navigate, Route, Routes } from 'react-router-dom'
import Movies from './pages/movies'
import Home from './pages/home'
import MovieDetails from './pages/movieDetails'
import SeatLayout from './pages/SeatLayout'
import MyBookings from './pages/myBookings'
import Favourite from './pages/favourite'
import Releases from './pages/releases'
import { useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Footer from './components/footer'
import { dummyShowsData } from './assets/assets'
import Layout from './pages/admin/Layout'
import Dashboard from './pages/admin/Dashboard'
import AddShow from './pages/admin/AddShow'
import DeleteShow from './pages/admin/DeleteShow'
import ListShow from './pages/admin/ListShows'
import ListBookings from './pages/admin/ListBookings'
import { useAppContext } from './context/AppContext'
import { SignIn } from '@clerk/react'
import Loading from './components/Loading'

const App = () => {

  const { pathname } = useLocation()
  const isAdminRoute = pathname.startsWith('/admin')
  const movieDetailsRoute = matchPath('/movies/:id', pathname)
  const isUnknownMovie = movieDetailsRoute
    && !dummyShowsData.some((movie) => movie._id === movieDetailsRoute.params.id)
  
  const { user, isClerkLoaded } = useAppContext()

  return(
    <>
    <Toaster/>
    {!isAdminRoute && <NavBar />}
    <Routes>
      <Route path='/' element={<Home/>} />
      <Route path='/movies' element={<Movies/>} />
      <Route path='/releases' element={<Releases/>} />
      <Route path='/movies/:id' element={<MovieDetails/>} />
      <Route path='/movies/:id/:date' element={<SeatLayout/>} />
      <Route path='/my-bookings' element={<MyBookings/>} />
      <Route path='/loading/:nextUrl' element={<Loading/>} />

      <Route path='/favourite' element={<Favourite/>} />
      <Route path='/admin/*' element={!isClerkLoaded ? <Loading/> : user ? <Layout/> : (
        <div className='min-h-screen flex justify-center items-center'>
          <SignIn fallbackRedirectUrl={'/admin'}/>
        </div>
      )}>
       <Route index element={<Dashboard/>}/>
       <Route path="add-show" element={<AddShow/>}></Route>
       <Route path="delete-show" element={<DeleteShow/>}></Route>
       <Route path="list-shows" element={<ListShow/>}></Route>
       <Route path='list-bookings' element={<ListBookings/>}></Route>
      </Route>
      <Route path='/my-bookings/admin' element={<Navigate to='/admin' replace />} />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
    {!isAdminRoute && !isUnknownMovie && <Footer/>}
    </>
  )
}

export default App
