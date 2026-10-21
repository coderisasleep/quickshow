import { useState, useEffect } from 'react'
import  { LayoutDashboard, MenuIcon , SearchIcon, Ticket, TicketPlus, XIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { useClerk, UserButton, useUser } from '@clerk/react'
import { useAppContext } from '../context/AppContext'


const navBar = () => {

  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const {user} = useUser()
  const { openSignIn } = useClerk()

  const navigate = useNavigate()

  const { favouriteMovies, isAdmin } = useAppContext()

  useEffect(() => {
    let lastY = window.scrollY

    const handleScroll = () => {
      const currentY = window.scrollY

      if (isOpen) {
        setIsVisible(true)
        lastY = currentY
        return
      }

      if (currentY <= 30) {
        setIsVisible(true)
        lastY = currentY
        return
      }

      const diff = currentY - lastY
      if (diff > 5) {
        setIsVisible(false)
      } else if (diff < -5) {
        setIsVisible(true)
      }

      lastY = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isOpen])

  return(
    <div className={`fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <Link to="/" className='max-md:flex-1'>
      <img src={assets.logo} alt="" className='w-36 h-auto'/>
      </Link>

      <div className={`max-md:fixed max-md:inset-0 max-md:w-full max-md:font-medium
                      max-md:text-lg z-50 flex flex-col md:flex-row items-center
                      justify-center gap-8 min-md:px-8 py-3 max-md:h-screen
                      min-md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border
                      border-gray-300/20 ${isOpen ? 'max-md:flex' : 'max-md:hidden'}`}>
                        
        <XIcon className='md:hidden absolute top-6 right-6 w-6  h-6 cursor-pointer' onClick={()=>setIsOpen(!isOpen)}/>
      <Link onClick={()=>{scrollTo(0,0); setIsOpen(false)}} to={'/'}>Home</Link>
      <Link onClick={()=>{scrollTo(0,0); setIsOpen(false)}} to={'/movies'}>Movies</Link>
      <Link onClick={()=>{scrollTo(0,0); setIsOpen(false)}} to={'/'}>Theatres</Link>
      <Link onClick={()=>{scrollTo(0,0); setIsOpen(false)}} to={'/releases'}>Releases</Link>
      {favouriteMovies.length >0 && <Link onClick={()=>{scrollTo(0,0); setIsOpen(false)}} to={'/favourite'}>Favourites</Link>}
      {isAdmin && <Link onClick={()=>{scrollTo(0,0); setIsOpen(false)}} to={'/admin'}>Admin</Link>}
      </div>

      <div className='flex items-center gap-8'>
        <SearchIcon className='max-md:hidden w-6 h-6 cursor-pointer'/>
        {
          !user ? (
                  <button onClick={openSignIn} className='px-4 py-1 sm:px-7 sm:py-2 bg-primary 
                   hover:bg-primary-dull transition rounded-full font-medium 
                   cursor-pointer'>Login</button>
                  ) : (
                   <UserButton>
                    <UserButton.MenuItems>
                      <UserButton.Action label = "My Bookings" labelIcon={<TicketPlus width={15}/>} onClick={()=>navigate('/my-bookings')}/>
                      {isAdmin && (
                        <UserButton.Action label = "Admin Dashboard" labelIcon={<LayoutDashboard width={15}/>} onClick={()=>navigate('/admin')}/>
                      )}
                    </UserButton.MenuItems>
                   </UserButton> 
                  )
        }
        
      </div>

      <MenuIcon className='max-md:ml-4 md:hidden w-8 h-8 cursor-pointer' onClick={()=> setIsOpen(!isOpen)}/>

    </div>
  )
}

export default navBar
