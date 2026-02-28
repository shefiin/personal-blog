import { BrowserRouter } from "react-router-dom";
import AppRouter from "./router";
import Navbar from "./Components/Navbar/Navbar";




function App(){
  return (
    <BrowserRouter>
      <Navbar/>
      <AppRouter/>
    </BrowserRouter>
  )
}

export default App







































