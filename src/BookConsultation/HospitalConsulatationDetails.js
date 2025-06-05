import React, { useState, useEffect } from 'react';
import { fetchAllData, fetchData, fetchUpdateData } from '../Helpers/externapi';
import { useNavigate, useLocation } from 'react-router-dom';
import Select from 'react-select';
import { Snackbar, Alert } from '@mui/material'; // Import Snackbar and Alert
import { logToCloudWatch } from '../Helpers/cloudwatchLogger';

const HospitalConsultationDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { fullName, age, gender, memberId, address, dateofBirth, mobileNumber, memberDependentId, hospitalId, hospitalName, service, bookingConsultationId } = location.state;

    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const getCurrentDateTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    const [loading, setLoading] = useState(false);
    const [services, setServices] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [appointmentDate, setAppointmentDate] = useState(getCurrentDateTime);
    const [reason, setReason] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [hospitalError, setHospitalError] = useState('');
    const [serviceError, setServiceError] = useState('');
    const [appointmentDateError, setAppointmentDateError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' }); // Snackbar state

    const employeeId = sessionStorage.getItem('EmployeeId');

    const UserId = sessionStorage.getItem('UserId');

    const getLogStreamName = () => {
        const today = new Date().toISOString().split('T')[0];
        return `${mobileNumber}-${today}`;
    };

    const logGroupName = process.env.REACT_APP_LOGGER;
    const logStreamName = getLogStreamName();

    console.log("bookingConsultationId", bookingConsultationId);

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const navigateBack = () => {
        navigate(-1);
    };

    useEffect(() => {
        const getServicesAndHospitals = async () => {
            try {
                setLoading(true);
                const serviceData = await fetchData("HospitalServices/all", { skip: 0, take: 0 });
                const dataServices = serviceData.map((item) => ({
                    label: item.ServiceName,
                    value: item.HospitalServicesId,
                }));
                setServices(dataServices);

                const hospitalData = await fetchData("Hospital/all", { skip: 0, take: 0 });
                const dataHospitals = hospitalData.map((item) => ({
                    label: item.HospitalName,
                    value: item.HospitalId,
                }));
                setHospitals(dataHospitals);

                const cardData = await fetchAllData(`lambdaAPI/OHOCards/GetMemberCardByMemberId/${memberId}`);
                if (cardData && cardData.status) {
                    setCardNumber(cardData.returnData[0].OHOCardnumber);
                }
            } catch (error) {
                console.error("Error fetching services or hospitals:", error);
            } finally {
                setLoading(false);
            }
        };

        getServicesAndHospitals();
    }, [memberId]);

    const validateFields = () => {
        let isValid = true;

        if (!appointmentDate) {
            setAppointmentDateError('Select Appointment Date');
            isValid = false;
        } else {
            setAppointmentDateError('');
        }

        if (service === 1 && !selectedService) {
            setServiceError('Please select a Service');
            isValid = false;
        } else {
            setServiceError('');
        }


        return isValid;
    };

    const handleBookAppointment = async () => {
        if (!validateFields()) {
            return;
        }


        const status = await fetchAllData(`lambdaAPI/Status/all`);
        const initiatedStatus = status.find(item => item.Value === "Booked");

        try {

            const updateData = [

                {
                    "TableName": "BookingConsultation",
                    "ColumnName": "ServiceTypeId",
                    "ColumnValue": selectedService?.value,
                    "TableId": bookingConsultationId,
                },
                {
                    "TableName": "BookingConsultation",
                    "ColumnName": "AppointmentDate",
                    "ColumnValue": appointmentDate,
                    "TableId": bookingConsultationId,
                },
                {
                    "TableName": "BookingConsultation",
                    "ColumnName": "Status",
                    "ColumnValue": initiatedStatus.StatusId,
                    "TableId": bookingConsultationId,
                },
                {
                    "TableName": "BookingConsultation",
                    "ColumnName": "Reason",
                    "ColumnValue": reason,
                    "TableId": bookingConsultationId,
                }


            ]

            const updateResponse = await fetchUpdateData("lambdaAPI/BookingConsultation/Update", updateData);

            // const response = await fetchData('BookingConsultation/bookAppointment/add', {
            //     name: fullName,
            //     gender,
            //     age,
            //     customerId: memberId,
            //     doctorName,
            //     dependentCustomerId: memberDependentId,
            //     hospitalName: hospitalName,
            //     hospitalId: hospitalId,
            //     address,
            //     dateofBirth,
            //     mobileNumber,
            //     appointmentDate,
            //     cardNumber,
            //     serviceTypeId: selectedService?.value,
            //     appointment: service,
            //     employeeId: UserId
            // });

            if (updateResponse.status) {
                await logToCloudWatch(logGroupName, logStreamName, {
                    event: 'Hospiatl Consultation Booked',
                    details: { updateResponse },
                });

                setSnackbar({
                    open: true,
                    message: `${fullName}'s hospital consultation booked successfully!`,
                    severity: 'success',
                });
                navigate('/MyBookings', {state: {memberId }});
            } else {

                await logToCloudWatch(logGroupName, logStreamName, {
                    event: 'Failed to book Hospiatl Consultation',
                    payload: [
                        {
                            "TableName": "BookingConsultation",
                            "ColumnName": "ServiceTypeId",
                            "ColumnValue": selectedService?.value,
                            "TableId": bookingConsultationId,
                            "updatedBy": UserId

                        },
                        {
                            "TableName": "BookingConsultation",
                            "ColumnName": "AppointmentDate",
                            "ColumnValue": appointmentDate,
                            "TableId": bookingConsultationId,
                            "updatedBy": UserId
                        },
                        {
                            "TableName": "BookingConsultation",
                            "ColumnName": "Status",
                            "ColumnValue": initiatedStatus.StatusId,
                            "TableId": bookingConsultationId,
                            "updatedBy": UserId
                        },
                        {
                            "TableName": "BookingConsultation",
                            "ColumnName": "Reason",
                            "ColumnValue": reason,
                            "TableId": bookingConsultationId,
                            "updatedBy": UserId
                        }
                    ],
                    response: updateResponse,
                });

                setSnackbar({
                    open: true,
                    message: `Error: ${updateResponse.message}`,
                    severity: 'error',
                });
            }
        } catch (error) {
            setLoading(false);
            console.error("Error booking appointment:", error);

            await logToCloudWatch(logGroupName, logStreamName, {
                event: 'Error -BookingConsultation/bookAppointment/add',
                payload: [
                    {
                        "TableName": "BookingConsultation",
                        "ColumnName": "ServiceTypeId",
                        "ColumnValue": selectedService?.value,
                        "TableId": bookingConsultationId,
                        "updatedBy": UserId
                    },
                    {
                        "TableName": "BookingConsultation",
                        "ColumnName": "AppointmentDate",
                        "ColumnValue": appointmentDate,
                        "TableId": bookingConsultationId,
                        "updatedBy": UserId
                    },
                    {
                        "TableName": "BookingConsultation",
                        "ColumnName": "Status",
                        "ColumnValue": initiatedStatus.StatusId,
                        "TableId": bookingConsultationId,
                        "updatedBy": UserId
                    },
                    {
                        "TableName": "BookingConsultation",
                        "ColumnName": "Reason",
                        "ColumnValue": reason,
                        "TableId": bookingConsultationId,
                        "updatedBy": UserId
                    }
                ],
                error: error
            });

            setSnackbar({
                open: true,
                message: 'Something went wrong. Please try again later.',
                severity: 'error',
            });
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const formData = {
            hospitalId: hospitalId,
            serviceId: selectedService?.value,
            appointmentDate,
            reason,
            cardNumber,
        };
        handleBookAppointment();
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <div
            className="d-flex flex-column justify-content-start align-items-center"
            style={{ minHeight: '100vh', width: '100vw', backgroundColor: '#0E94C3' }}
        >
            <div
                className="card"
                style={{
                    minWidth: windowSize.width < 576 ? '100vw' : windowSize.width <= 992 ? '75%' : '50%',
                    minHeight: '100vh',
                    position: 'relative',
                }}
            >
                {/* Header */}
                <div className="bg-body-tertiary sticky-top d-flex flex-row justify-content-between align-items-center p-2 px-4">
                    <div className="d-flex flex-row justify-content-start align-items-center">
                        <button
                            className="btn fs-3 p-0 me-3"
                            style={{ color: '#0E94C3' }}
                            onClick={navigateBack}
                        >
                            <i className="bi bi-arrow-left-circle-fill"></i>
                        </button>
                        <h5>Hospital Consultation</h5>
                    </div>
                    <div className="d-flex flex-column align-items-center">
                        <img
                            src="/applogo.png"
                            alt="logo"
                            style={{ maxHeight: '30px', maxWidth: '30px' }}
                        />
                        <span
                            className="app-brand-text fw-bolder"
                            style={{ fontSize: '10px', color: '#0094c6' }}
                        >
                            OHOINDIA
                        </span>
                    </div>
                </div>

                {/* Main Content */}
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <div className="p-4">
                        <h3 className="text-primary mb-4">Book an Appointment for {fullName}</h3>
                        <form onSubmit={handleFormSubmit}>



                            {/* Appointment Date */}
                            <div className="mb-3">
                                <label className="form-label"><strong>Appointment Date & Time</strong></label>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    value={appointmentDate}
                                    onChange={(e) => setAppointmentDate(e.target.value)}
                                />
                                {appointmentDateError && <small className="text-danger">{appointmentDateError}</small>}
                            </div>

                            <div className="mb-3">
                                <label className="form-label"><strong>Enter Reason</strong></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Enter reason"
                                />
                            </div>


                            {/* Service Type Dropdown */}

                            {(service === 1 || service === 2) ?
                                <>
                                    <div className="mb-3">
                                        <label className="form-label"><strong>Service Type</strong></label>
                                        <Select
                                            options={services}
                                            value={selectedService}
                                            onChange={(selectedOption) => setSelectedService(selectedOption)}
                                            placeholder="Search and select service type"
                                        />
                                        {serviceError && <small className="text-danger">{serviceError}</small>}
                                    </div>



                                </>
                                : null}


                            {/* Book Appointment Button */}
                            <button type="submit" className="btn btn-primary">
                                Book Appointment
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default HospitalConsultationDetails;
