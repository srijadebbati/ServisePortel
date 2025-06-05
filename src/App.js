import './App.css';


//import Home from './Home/index';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HospitalServices from './BookConsultation/HospitalServices';
import HospitalConsultationDetails from './BookConsultation/HospitalConsulatationDetails';
import ConsultationList from './BookConsultation/ConsultationList';
import MemberSelection from './BookConsultation/MemberSelection';
import Login from './Login';
import Hospitals from './Hospitals/Hospitals';
//import HospitalValidation from './HospitalValidation/HospitalValidation';
import ProtectedRoute from './ProtectedRoute/ProtectedRoute';
//import Customers from './Customers/Customers';
//import ConfirmBooking from './ConfirmBooking/ConfirmBooking';

function App() {
    return (
        <Router>
            <Routes>
                {/* <Route path="/" element={<HospitalValidation />} /> */}
                

                
                    <Route path="/" element={<Login />} />
                    
                    <Route element={<ProtectedRoute />}>

                    <Route path='/Hospitals'  element={<Hospitals />} />    

                    <Route path='/HospitalServices' element={<HospitalServices />}  /> 

                    <Route path='/hospitalConsulationForm' element={<HospitalConsultationDetails />} />

                    <Route path='/MyBookings' element={<ConsultationList />} />

                    <Route path='/MemberSelection' element={<MemberSelection />} />

                    </Route>
                    {/* <Route path="/bookconsultation" element={<Home />} /> */}

                {/* <Route path="/confirmBooking/:Id" element={<ConfirmBooking />} /> */}
            </Routes>
        </Router>
    );
}

export default App;
