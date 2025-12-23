import { BrowserRouter, Routes, Route } from "react-router-dom";
import ApplyStore from "../features/store/pages/ApplyStore";
import Login from "../features/store/pages/Login";
import Register from "../features/store/pages/Register";

function Home(){
    return <h2>Home</h2>;
}

export default function AppRouter(){
    return(
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home/>}/>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/store/apply" element={<ApplyStore />} />
            </Routes>
        </BrowserRouter>
    );
}