import { BrowserRouter, Link } from "react-router-dom";
import AppRouter from "./router";
import Navbar from "./Components/Navbar/Navbar";

function App(){
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Navbar/>
        <div className="flex-1">
          <AppRouter/>
        </div>
        <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-600">
          <span>personal-blog all rights reserved - </span>
          <Link to="/login" className="font-medium text-slate-800 hover:text-slate-600">
            Admin
          </Link>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App







































