import { Outlet } from "react-router-dom"
import AdminNavbar from "../../components/admin/AdminNavbar"
import AdminSidebar from "../../components/admin/AdminSidebar"
import { useAppContext } from "../../context/AppContext"
import Loading from "../../components/Loading"

const Layout = () =>{

    const {isAdmin, isLoadingAdmin, adminCheckError, fetchIsAdmin} = useAppContext()

    if(isLoadingAdmin){
        return <Loading/>
    }

    if(adminCheckError){
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
                <p>{adminCheckError}</p>
                <button onClick={fetchIsAdmin} className="rounded-md bg-primary px-5 py-2 text-white">
                    Retry
                </button>
            </div>
        )
    }

    return isAdmin ?(
        <>
        <AdminNavbar/>
        <div className="flex">
            <AdminSidebar/>
            <div className="flex-1 px-4 py-10 md:px-10 h-[calc(100vh-64px)] overflow-y-auto">
                <Outlet/>
            </div>
        </div>
        </>
    ) : <Loading/>
}

export default Layout