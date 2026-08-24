import { Navigate, Route, Routes } from "react-router";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import YawRateDetailPage from "./pages/DetailPages/YawRateDetailPage/YawRateDetailPage.jsx";
import RollrateDetailPage from "./pages/DetailPages/RollrateDetailPage/RollrateDetailPage.jsx";
import PowerStatusDetailPage from "./pages/DetailPages/PowerStatusDetailPage/PowerStatusDetailPage.jsx";

function App() {
    return (
        <Routes>
            <Route
                path="/"
                element={<Dashboard/>}
            />
            <Route
                path="/detail/yawrate"
                element={<YawRateDetailPage />}
            />
            <Route
                path="/detail/rollrate"
                element={<RollrateDetailPage/>}
            />
            <Route
                path="/detail/powerstatus"
                element = {<PowerStatusDetailPage/>}
            />

        </Routes>
    );
}

export default App;
