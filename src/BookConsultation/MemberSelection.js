import React, { useState, useEffect } from 'react';
import { fetchAllData, fetchData } from '../Helpers/externapi';
import Footer from '../CommonComponents/Footer';
import { useNavigate, useLocation } from 'react-router-dom';
import { logToCloudWatch } from '../Helpers/cloudwatchLogger';

const MemberSelection = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { memberId, service, hospitalName, hospitalId, mobileNumber} = location.state;


    const userId = sessionStorage.getItem('UserId');

    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    const [member, setMember] = useState([]);
    const [fullName, setFullName] = useState('');
    const [gender, setGender] = useState('');
    const [age, setAge] = useState('');
    const [dependents, setDependents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cardNumber, setCardNumber] = useState('');

    const getLogStreamName = () => {
        const today = new Date().toISOString().split('T')[0];
        return `${mobileNumber}-${today}`;
    };

    const logGroupName = process.env.REACT_APP_LOGGER;
    const logStreamName = getLogStreamName();


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

    const fetchCustomerData = async () => {
        try {
            setLoading(true);
            // Fetch primary member details
            fetchAllData(`lambdaAPI/Customer/GetById/${memberId}`).then((memberData) => {
                if (memberData && memberData.length > 0) {
                    setMember(memberData);
                    const { Name, Gender, Age } = memberData[0];
                    setFullName(Name);
                    setGender(Gender);
                    setAge(Age);
                }
            });

            // Fetch dependent members
            fetchAllData(`lambdaAPI/Customer/GetDependentsByCustomerId/${memberId}`).then((memberDependents) => {
                if (memberDependents && memberDependents.length > 0) {
                    setDependents(memberDependents);
                }
            });

            const cardData = await fetchAllData(`lambdaAPI/OHOCards/GetMemberCardByMemberId/${memberId}`);
            if (cardData && cardData.status) {
                setCardNumber(cardData.returnData[0].OHOCardnumber);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomerData();
    }, []);

    const navigateBack = () => {
        navigate(-1);
    };



    const handleDependentPress = async (dependent) => {



        const status = await fetchAllData(`lambdaAPI/Status/all`);
        const initiatedStatus = status.find(item => item.Value === "Initiated");


        const response = await fetchData('lambdaAPI/BookingConsultation/bookAppointment/add', {
            name: dependent.name,
            gender: dependent.gender,
            age: dependent.age,
            customerId: memberId,
            dependentCustomerId: dependent.customerId,
            address: member[0].AddressLine1,
            dateofBirth: dependent.dateofBirth,
            mobileNumber: dependent.mobileNumber,
            cardNumber,
            employeeId: memberId,
            status: initiatedStatus.StatusId,
            hospitalPoliciesId: service,
            hospitalName: hospitalName,
            hospitalId: hospitalId,
        });



        if (response.status) {
            await logToCloudWatch(logGroupName, logStreamName, {
                event: `${service === 1 ? 'Free Consultation Booked'
                    : service === 2 ? 'Lab Investigation Booked' : 'Pharmacy Discount Claimed'
                    } Successfully`,
                details: { response: response },
            });


        } else if (response.message) {
            await logToCloudWatch(logGroupName, logStreamName, {
                event: 'Failed to Book Consultation -lambdaAPI/BookingConsultation/bookAppointment/add',
                payload:{
                    name: dependent.name,
                    gender: dependent.gender,
                    age: dependent.age,
                    customerId: memberId,
                    dependentCustomerId: dependent.customerId,
                    address: member[0].AddressLine1,
                    dateofBirth: dependent.dateofBirth,
                    mobileNumber: dependent.mobileNumber,
                    cardNumber,
                    employeeId: memberId,
                    status: initiatedStatus.StatusId,
                    hospitalPoliciesId: service,
                    hospitalName: hospitalName,
                    hospitalId: hospitalId,
                },
                response: response,
            });


        } else {
            await logToCloudWatch(logGroupName, logStreamName, {
                event: 'Failed to Book Consultation -lambdaAPI/BookingConsultation/bookAppointment/add',
                payload: {
                    name: dependent.name,
                    gender: dependent.gender,
                    age: dependent.age,
                    customerId: memberId,
                    dependentCustomerId: dependent.customerId,
                    address: member[0].AddressLine1,
                    dateofBirth: dependent.dateofBirth,
                    mobileNumber: dependent.mobileNumber,
                    cardNumber,
                    employeeId: memberId,
                    status: initiatedStatus.StatusId,
                    hospitalPoliciesId: service,
                    hospitalName: hospitalName,
                    hospitalId: hospitalId,
                },
                response: response,
            });

        }



        if (response) {
            navigate('/hospitalConsulationForm', {
                state: {
                    fullName: dependent.name, gender: dependent.gender, age: dependent.age, memberId, memberDependentId: dependent.customerId,
                    dateofBirth: dependent.dateofBirth, mobileNumber: dependent.mobileNumber, address: member[0].AddressLine1, isFromBookService: true, bookingConsultationId: response.data?.bookingConsultationId || response.data[0]?.BookingConsultationId

                }
            });
        }

    };

    const handleMemberPress = async (memberId) => {

        const status = await fetchAllData(`lambdaAPI/Status/all`);
        const initiatedStatus = status.find(item => item.Value === "Initiated");


        const response = await fetchData('lambdaAPI/BookingConsultation/bookAppointment/add', {
            name: fullName,
            gender,
            age,
            customerId: memberId,
            dependentCustomerId: null,
            address: member[0].AddressLine1,
            dateofBirth: member[0].DateofBirth,
            mobileNumber: member[0].MobileNumber,
            cardNumber,
            employeeId: userId,
            status: initiatedStatus.StatusId,
            hospitalPoliciesId: service,
            hospitalName: hospitalName,
            hospitalId: hospitalId,
        });


        if (response.status) {
            await logToCloudWatch(logGroupName, logStreamName, {
                event: `${service === 1 ? 'Free Consultation Booked'
                    : service === 2 ? 'Lab Investigation Booked' : 'Pharmacy Discount Claimed'
                    } Successfully`,
                details: { response: response },
            });


        } else if (response.message) {
            await logToCloudWatch(logGroupName, logStreamName, {
                event: 'Failed to Book Consultation -lambdaAPI/BookingConsultation/bookAppointment/add',
                payload:{
                    name: fullName,
                    gender,
                    age,
                    customerId: memberId,
                    dependentCustomerId: null,
                    address: member[0].AddressLine1,
                    dateofBirth: member[0].DateofBirth,
                    mobileNumber: member[0].MobileNumber,
                    cardNumber,
                    employeeId: userId,
                    status: initiatedStatus.StatusId,
                    hospitalPoliciesId: service,
                    hospitalName: hospitalName,
                    hospitalId: hospitalId,
                },
                response: response,
            });


        } else {
            await logToCloudWatch(logGroupName, logStreamName, {
                event: 'Failed to Book Consultation -lambdaAPI/BookingConsultation/bookAppointment/add',
                payload:{
                    name: fullName,
                    gender,
                    age,
                    customerId: memberId,
                    dependentCustomerId: null,
                    address: member[0].AddressLine1,
                    dateofBirth: member[0].DateofBirth,
                    mobileNumber: member[0].MobileNumber,
                    cardNumber,
                    employeeId: userId,
                    status: initiatedStatus.StatusId,
                    hospitalPoliciesId: service,
                    hospitalName: hospitalName,
                    hospitalId: hospitalId,
                },
                response: response,
            });

        }

        if (response) {

            navigate('/hospitalConsulationForm', {
                state: {
                    memberId, fullName, gender, age, address: member[0].AddressLine1,
                    dateofBirth: member[0].DateofBirth, mobileNumber: member[0].MobileNumber, isFromBookService: true, bookingConsultationId: response.data?.bookingConsultationId || response.data[0]?.BookingConsultationId
                }
            });
        }


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
                        <h5>Family Members</h5>
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

                    <div className="p-4" style={{ overflowY: 'scroll', height: 'calc(100vh - 150px)' }}>
                        {/* Primary Member Card */}
                        <div
                            className="card p-3 mb-3 rounded shadow-sm d-flex flex-row align-items-center justify-content-between"
                            style={{
                                cursor: 'pointer',
                                transition: 'all 0.3s ease-in-out',
                                border: 'none',
                                backgroundColor: '#ffffff',
                                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
                            }}
                            onClick={() => handleMemberPress(memberId)}
                        >
                            <div>
                                <h5 className="mb-2" style={{ color: '#007bff', fontWeight: 'bold' }}>Primary Member</h5>
                                <p className="mb-1"><strong>Name:</strong> {fullName || 'N/A'}</p>
                                <p className="mb-1"><strong>Gender:</strong> {gender || 'N/A'}</p>
                                <p className="mb-0"><strong>Age:</strong> {age || 'N/A'}</p>
                            </div>
                            <i
                                className="bi bi-chevron-right"
                                style={{
                                    fontSize: '1.5rem',
                                    color: '#6c757d',
                                    transition: 'transform 0.3s ease-in-out',
                                }}
                            ></i>
                        </div>

                        {/* Dependents Section */}
                        {dependents.length > 0 ? (
                            dependents.map((dependent) => (
                                <div
                                    key={dependent.Id}
                                    className="card p-3 mb-3 rounded shadow-sm d-flex flex-row align-items-center justify-content-between"
                                    style={{
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease-in-out',
                                        border: 'none',
                                        backgroundColor: '#ffffff',
                                        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
                                    }}
                                    onClick={() => handleDependentPress(dependent)}
                                >
                                    <div>
                                        <p className="mb-1"><strong>Name:</strong> {dependent.name || 'N/A'}</p>
                                        <p className="mb-1"><strong>Relationship:</strong> {dependent.relationship || 'N/A'}</p>
                                        <p className="mb-1"><strong>Age:</strong> {dependent.age || 'N/A'}</p>
                                        <p className="mb-0"><strong>Gender:</strong> {dependent.gender || 'N/A'}</p>
                                    </div>
                                    <i
                                        className="bi bi-chevron-right"
                                        style={{
                                            fontSize: '1.5rem',
                                            color: '#6c757d',
                                            transition: 'transform 0.3s ease-in-out',
                                        }}
                                    ></i>
                                </div>
                            ))
                        ) : (
                            <p className="text-center" style={{ color: '#6c757d', fontStyle: 'italic' }}>No family members found.</p>
                        )}
                    </div>

                )}


            </div>
        </div>
    );
};

export default MemberSelection;
