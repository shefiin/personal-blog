import { BrowserRouter } from "react-router-dom";
import  AppRouter  from "./router/index.jsx";
import Navbar from "./Components/Navbar/Navbar.jsx";




function App(){
  return (
    <BrowserRouter>
      <Navbar/>
      <AppRouter/>
    </BrowserRouter>
  )
}

export default App








































