import { Navigate, Route, Routes } from "react-router";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import YawRateDetailPage from "./pages/DetailPages/YawRateDetailPage/YawRateDetailPage.jsx";

function App() {
    return (
        <Routes>
            <Route
                path="/"
                element={<Dashboard/>}
            />
            <Route
                path="/graph/:sensortype"
                element={<YawRateDetailPage />}
            />
        </Routes>
    );
}

export default App;
