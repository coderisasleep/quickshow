import NavBar from './components/navBar'
import { matchPath, Route, Routes } from 'react-router-dom'
import Movies from './pages/movies'
import Home from './pages/home'
import MovieDetails from './pages/movieDetails'
import SeatLayout from './pages/SeatLayout'
import MyBookings from './pages/myBookings'
import Favourite from './pages/favourite'
import { useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Footer from './components/footer'
import { dummyShowsData } from './assets/assets'
import Layout from './pages/admin/Layout'
import Dashboard from './pages/admin/Dashboard'
import AddShow from './pages/admin/AddShow'
import ListShow from './pages/admin/ListShows'
import ListBookings from './pages/admin/ListBookings'

const App = () => {

  const { pathname } = useLocation()
  const isAdminRoute = pathname.startsWith('/admin')
  const movieDetailsRoute = matchPath('/movies/:id', pathname)
  const isUnknownMovie = movieDetailsRoute
    && !dummyShowsData.some((movie) => movie._id === movieDetailsRoute.params.id)

  return(
    <>
    <Toaster/>
    {!isAdminRoute && <NavBar />}
    <Routes>
      <Route path='/' element={<Home/>} />
      <Route path='/movies' element={<Movies/>} />
      <Route path='/movies/:id' element={<MovieDetails/>} />
      <Route path='/movies/:id/:date' element={<SeatLayout/>} />
      <Route path='/myBookings' element={<MyBookings/>} />
      <Route path='/favourite' element={<Favourite/>} />
      <Route path='/admin/*' element={<Layout/>}>
       <Route index element={<Dashboard/>}/>
       <Route path="add-show" element={<AddShow/>}></Route>
       <Route path="list-shows" element={<ListShow/>}></Route>
       <Route path='list-bookings' element={<ListBookings/>}></Route>
      </Route>
    </Routes>
    {!isAdminRoute && !isUnknownMovie && <Footer/>}
    </>
  )
}

export default App
