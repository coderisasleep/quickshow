import { LayoutDashboardIcon, PlusSquareIcon, Trash2Icon, ListIcon, ListCollapseIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { assets } from '../../assets/assets'
import { useAppContext } from '../../context/AppContext'

const AdminSidebar = () =>{

    const { user } = useAppContext()
    const pfp = user?.imageUrl || assets.profile

    const adminNavlinks = [
        {name:'Dashboard',path:'/admin', icon: LayoutDashboardIcon},
        {name:'Add Shows',path:'/admin/add-show', icon: PlusSquareIcon},
        {name:'Delete Shows',path:'/admin/delete-show', icon: Trash2Icon},
        {name:'List Shows',path:'/admin/list-shows',icon:ListIcon},
        {name:'List Bookings',path:'/admin/list-bookings',icon:ListCollapseIcon}
    ]

    return (
        <aside className='flex h-[calc(100vh-64px)] w-20 flex-col items-center border-r border-gray-300/20 bg-slate-950/40 pt-8 text-sm text-gray-300 shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)] transition-all duration-200 md:w-60'>
          <img className='h-10 w-10 rounded-full object-cover md:h-14 md:w-14' src={pfp} alt="sidebar"/>
          <p className='mt-2 hidden text-base font-medium text-white md:block'>Admin User</p>

          <nav className='mt-6 w-full space-y-1'>
            {adminNavlinks.map((link,index)=>(
                 <NavLink
                    key={index}
                    to={link.path} end
                    className={({isActive})=> `relative flex w-full items-center justify-center gap-2 py-3 transition-colors duration-200 md:justify-start md:pl-10 ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                    {({isActive})=>(
                       <>
                       <link.icon className='h-5 w-5 shrink-0'/>
                       <p className='hidden md:block'>{link.name}</p>
                       <span className={`absolute right-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full ${isActive ? 'bg-primary' : 'bg-transparent'}`} />
                       </>
                    )}

                 </NavLink>
            ))}
          </nav>
        </aside>
    )
}

export default AdminSidebar