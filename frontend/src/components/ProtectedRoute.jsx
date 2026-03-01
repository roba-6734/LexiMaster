import {Navigate, useLocation} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';


const ProtectedRoute = ({children}) =>{
    const {isAuthenticated,loading} = useAuth()
    const location = useLocation()

    if(loading){
        return (
      <div className="min-h-screen px-6 py-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 shadow-lg shadow-slate-900/5">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-secondary/25 border-t-primary"></div>
          <p className="caption">Preparing your workspace...</p>
        </div>
      </div>
    );
    }
    if(!isAuthenticated){
        return <Navigate to='/login' state={{from:location}} replace />
    }
    return children;
}

export default ProtectedRoute;
