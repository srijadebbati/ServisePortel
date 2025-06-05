import React, { useState, useEffect, useRef } from 'react';
import { fetchAllData, fetchData } from '../Helpers/externapi';
import { useNavigate, useLocation } from 'react-router-dom';
import Select from 'react-select';
import { Snackbar, Alert } from '@mui/material'; // Import Snackbar and Alert
import { logToCloudWatch } from '../Helpers/cloudwatchLogger';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCheck, faTicket, faRupeeSign } from '@fortawesome/free-solid-svg-icons';


const HospitalServices = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { memberId, address, dateofBirth, mobileNumber, memberDependentId, hospitalId, hospitalName, distributorId, bookingConsultationId } = location.state;

    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const [loading, setLoading] = useState(false);
    const [services, setServices] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [appointmentDate, setAppointmentDate] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [hospitalError, setHospitalError] = useState('');
    const [serviceError, setServiceError] = useState('');
    const [appointmentDateError, setAppointmentDateError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' }); // Snackbar state
    const [amount, setAmount] = useState('');
    const [memberLoading, setMemberLoading] = useState(false);

    const employeeId = sessionStorage.getItem('EmployeeId');

    const [cardNumber, setCardNumber] = useState(null);
    const [couponCount, setCouponCount] = useState(0);
    const [hospitalServices, setHospitalServices] = useState([]);
    const [servicesLoading, setServicesLoading] = useState(true);
    const [error, setError] = useState(null);
    const [memberCoupons, setMemberCoupons] = useState({});
    const [dependentCoupons, setDependentCoupons] = useState({});

    const UserId = sessionStorage.getItem('UserId');

   
    const [showModal, setShowModal] = useState(false);
    const [member, setMember] = useState("");
    const [dependents, setDependents] = useState([]);
    const [fullName, setFullName] = useState('');
    const [gender, setGender] = useState('');
    const [age, setAge] = useState('');

    const userId = sessionStorage.getItem('UserId');

    const [position, setPosition] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const containerRef = useRef(null);
    const sliderRef = useRef(null);


    const getLogStreamName = () => {
        const today = new Date().toISOString().split('T')[0];
        return `${member.MobileNumber}-${today}`;
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

    const navigateBack = () => {
        navigate(-1);
    };

    useEffect(() => {
        fetchProfileUrl();
        fetchHospitalData();
    }, []);

    const fetchProfileUrl = async () => {
        try {
            setLoading(true);
            const getConfigValues = await fetchData('ConfigValues/all', { skip: 0, take: 0 });

            const profileUrl = getConfigValues && getConfigValues.find(value => value.ConfigKey === 'couponAmount');
            setAmount(profileUrl.ConfigValue);
        } catch (e) {
            console.error("Error fetching config Values ConfigValues/all", e);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (showModal) {
            const fetchMemberData = async () => {
                try {
                    // Fetch main member data
                    setMemberLoading(true);
                    const memberData = await fetchAllData(`lambdaAPI/Customer/GetById/${memberId}`);
                    if (memberData && memberData.length > 0) {
                        setMember(memberData[0]);
                        const { Name, Gender, Age } = memberData[0];
                        setFullName(Name);
                        setGender(Gender);
                        setAge(Age);
                    }

                    // Fetch dependents data
                    const memberDependents = await fetchAllData(
                        `lambdaAPI/Customer/GetDependentsByCustomerId/${memberId}`
                    );
                    if (memberDependents && memberDependents.length > 0) {
                        setDependents(memberDependents);
                    }

                    const cardData = await fetchAllData(`lambdaAPI/OHOCards/GetMemberCardByMemberId/${memberId}`);
                    if (cardData && cardData.status) {
                        setCardNumber(cardData.returnData[0].OHOCardnumber);
                    }

                    // Fetch coupon availability for main member
                    const memberCouponResponse = await fetchData("lambdaAPI/BookingConsultation/checkIndividualCoupons", {
                        CustomerId: memberId,
                        DependentCustomerId: null,
                        hospitalId: hospitalId,
                    });

                    setMemberCoupons((prev) => ({
                        ...prev,
                        [memberId]: memberCouponResponse.availableCoupons, // Store available coupons
                    }));

                    // Fetch coupon availability for each dependent
                    for (const dependent of memberDependents || []) {
                        const dependentCouponResponse = await fetchData("lambdaAPI/BookingConsultation/checkIndividualCoupons", {
                            CustomerId: memberId,
                            DependentCustomerId: dependent.customerId,
                            hospitalId: hospitalId,
                        });

                        setDependentCoupons((prev) => ({
                            ...prev,
                            [dependent.customerId]: dependentCouponResponse.availableCoupons, // Store available coupons
                        }));
                    }

                } catch (error) {
                    console.error("Error fetching data:", error);
                } finally {
                    setMemberLoading(false);
                }
            };

            fetchMemberData();
        }
    }, [showModal, memberId]);



    const fetchHospitalData = async () => {
        try {
            setServicesLoading(true);






            const cardResponse = await fetchAllData(`/lambdaAPI/OHOCards/GetMemberCardByMemberId/${memberId}`);


            const servicesResponse = await fetchAllData(`HospitalPoliciesProvision/GetByHospitalId/${hospitalId}`);


            if (servicesResponse) {
                setHospitalServices(servicesResponse || []);
            }

            const couponResponse = await fetchData('lambdaAPI/BookingConsultation/checkAvailableCoupons', {

                cardNumber: cardResponse.returnData[0].OHOCardnumber,
                hospitalId,
                customerId: memberId

            });
            setCouponCount(couponResponse.status ? couponResponse.availableCoupons : 0);

        } catch (err) {
            setError('Error fetching data');
            console.error('Error fetching data:', err);
        } finally {
            setServicesLoading(false);
        }
    };

    const handleHospitalConsultation = async (service, dependent) => {


        const status = await fetchAllData(`lambdaAPI/Status/all`);
        const initiatedStatus = status.find(item => item.Value === "Initiated");


        const response = await fetchData('lambdaAPI/BookingConsultation/bookAppointment/add', {
            name: dependent.name ? dependent.name : fullName,
            gender: dependent.gender ? dependent.gender : gender,
            age: dependent.age ? dependent.age : age,
            customerId: memberId,
            dependentCustomerId: dependent.customerId ? dependent.customerId : null,
            address: member.AddressLine1,
            dateofBirth: dependent.dateofBirth ? dependent.dateofBirth : member.DateofBirth,
            mobileNumber: dependent.mobileNumber ? dependent.mobileNumber : member.MobileNumber,
            cardNumber,
            employeeId: userId,
            hospitalName: hospitalName,
            hospitalId: hospitalId,
            status: initiatedStatus.StatusId,
            hospitalPoliciesId: service
        });


        if (response.status) {
            await logToCloudWatch(logGroupName, logStreamName, {
                event: `${service === 1 ? 'Free Consultation Booked'
                    : service === 2 ? 'Lab Investigation Booked' : 'Pharmacy Discount Claimed'
                    } Successfully`,
                details: { response: response },
            });
          
        } else {
            await logToCloudWatch(logGroupName, logStreamName, {
                event: 'Failed to Book Consultation -lambdaAPI/BookingConsultation/bookAppointment/add',
                payload:{
                    name: dependent.name ? dependent.name : fullName,
                    gender: dependent.gender ? dependent.gender : gender,
                    age: dependent.age ? dependent.age : age,
                    customerId: memberId,
                    dependentCustomerId: dependent.customerId ? dependent.customerId : null,
                    address: member.AddressLine1,
                    dateofBirth: dependent.dateofBirth ? dependent.dateofBirth : member.DateofBirth,
                    mobileNumber: dependent.mobileNumber ? dependent.mobileNumber : member.MobileNumber,
                    cardNumber,
                    employeeId: userId,
                    hospitalName: hospitalName,
                    hospitalId: hospitalId,
                    status: initiatedStatus.StatusId,
                    hospitalPoliciesId: service
                },
                response: response,
            });

        }

        if (response) {
            navigate("/hospitalConsulationForm", {
                state: {
                    fullName, gender, age, memberId, memberDependentId, cardNumber,
                    dateofBirth, mobileNumber, address, hospitalId, hospitalName, service, distributorId, UserId, bookingConsultationId: response.data?.bookingConsultationId || response.data[0]?.BookingConsultationId

                }
            });
        };
    }

    const handleHospitalConsultationLab = async (service) => {


        navigate("/MemberSelection", {
            state: {
                fullName, gender, age, memberId, memberDependentId, cardNumber,
                dateofBirth, mobileNumber, address, hospitalId, hospitalName, service, distributorId, UserId,
            }
        });
    }


    const handleStart = (startX) => {
        const handleMove = (moveX) => {
            if (!containerRef.current || !sliderRef.current) return;
    
            const containerWidth = containerRef.current.clientWidth;
            const sliderWidth = sliderRef.current.clientWidth;
            const maxPosition = containerWidth - sliderWidth;
    
            const newPosition = Math.max(0, Math.min(moveX - startX, maxPosition));
            setPosition(newPosition);
    
            // Check if slider has reached the end
            if (newPosition >= maxPosition - 10) {
                setIsCompleted(true);
    
                // Redirect to phone dialer after a slight delay
                setTimeout(() => {
                    window.location.href = "tel:7032107108";
                    setTimeout(() => {
                        setPosition(0); // Reset slider position after a delay
                        setIsCompleted(false);
                    }, 1000);
                }, 500);
            }
        };
    
        const handleEnd = () => {
            if (!isCompleted) {
                setPosition(0); // Reset position if not completed
            }
    
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
        };
    
        const handleMouseMove = (e) => handleMove(e.clientX);
        const handleTouchMove = (e) => handleMove(e.touches[0].clientX);
        const handleMouseUp = handleEnd;
        const handleTouchEnd = handleEnd;
    
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", handleTouchEnd);
    };
    
    const handleMouseDown = (e) => {
        e.preventDefault();
        handleStart(e.clientX);
    };
    
    const handleTouchStart = (e) => {
        e.preventDefault();
        handleStart(e.touches[0].clientX);
    };
    




    const containerStyle = {
        width: '80%',
        backgroundColor: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '9999px',
        padding: '6px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        margin: '0 auto',

    };

    const trackStyle = {
        position: 'relative',
        width: '100%',
        height: '60px',
        backgroundColor: 'rgba(233, 236, 239, 0.6)',
        borderRadius: '9999px',
        overflow: 'hidden',
        transition: 'background-color 0.3s ease',
    };

    const textStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',  // ✅ Added to ensure proper centering
        transform: 'translate(-50%, -50%)',
        width: '100%', // ✅ Ensures the text takes the full width
        textAlign: 'center', // ✅ Aligns text properly
        color: '#6c757d',
        fontSize: '0.875rem',
        fontWeight: '600',
        letterSpacing: '0.05em',
        zIndex: 10,
        pointerEvents: 'none',
        opacity: isCompleted ? 0.7 : 1,
        transition: 'opacity 0.3s ease',
        whiteSpace: 'nowrap', // ✅ Prevents text from breaking into multiple lines
        overflow: 'hidden', // ✅ Hides overflowing text
        textOverflow: 'ellipsis', // ✅ Adds "..." if text is too long
    };

    const getSliderStyle = () => ({
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        left: `${position}px`,
        width: '60px',
        height: '60px',
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        transition: 'all 0.3s ease-in-out',
        backgroundColor: isCompleted
            ? '#2ecc71'
            : (isHovering ? '#f1f3f5' : '#ffffff'),
        boxShadow: isCompleted
            ? '0 10px 15px rgba(0, 0, 0, 0.1)'
            : '0 4px 6px rgba(0, 0, 0, 0.08)',
        transform: `translateY(-50%) ${isHovering && !isCompleted ? 'scale(1.05)' : 'scale(1)'}`,
        zIndex: 20,
        border: isHovering && !isCompleted
            ? '1px solid #dee2e6'
            : 'none',
    });

    const iconStyle = {
        width: '28px',
        height: '28px',
        color: isCompleted ? '#ffffff' : '#3498db',
        transition: 'all 0.3s ease',
        transform: isHovering && !isCompleted ? 'scale(1.1)' : 'scale(1)',
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
                        <h5>Hospital Services</h5>
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
                    <>
                        <div className="container mt-4">
                            <h3 className="text-primary text-center">{hospitalName}</h3>
                            <h5 className="text-center">Available Services</h5>

                            {servicesLoading ? (
                                <div className="text-center mt-4">Loading...</div>
                            ) : hospitalServices.length > 0 ? (
                                hospitalServices.map((service, index) => (
                                    <div key={index} className="card my-3 shadow-sm">
                                        <div className="card-body">
                                            <h5 className="card-title">{service.PoliciesType}</h5>

                                            {service.IsActive ? (
                                                service.PoliciesType === 'Free Consultation' ? (
                                                    <>
                                                        <div className="card-text d-flex flex-column">

                                                            {couponCount > 0 && (
                                                                <div className="d-flex flex-column align-items-center text-center position-relative">
                                                                    <div className="position-relative" style={{ display: "inline-block" }}>
                                                                        <img
                                                                            src="https://storingdocuments.s3.ap-south-1.amazonaws.com/coupon.jfif"
                                                                            alt="Coupon"
                                                                            className="img-fluid"
                                                                            style={{ maxWidth: "250px", borderRadius: "8px" }}
                                                                        />

                                                                        {/* Amount Text */}
                                                                        <div
                                                                            style={{
                                                                                position: "absolute",
                                                                                top: "58%",
                                                                                left: "49%",
                                                                                transform: "translate(-50%, -10px)",
                                                                                fontSize: "12px",
                                                                                color: "#0E3984",
                                                                                fontWeight: "bold",
                                                                                textAlign: "center",
                                                                                width: "100%",
                                                                            }}
                                                                        >
                                                                            Worth of RS. {amount}/-
                                                                        </div>

                                                                        {/* Validity Text */}
                                                                        <div
                                                                            style={{
                                                                                position: "absolute",
                                                                                bottom: "13px",
                                                                                left: "33px",
                                                                                width: "85%",
                                                                                display: "flex",
                                                                                justifyContent: "center",
                                                                                alignItems: "center",
                                                                            }}
                                                                        >
                                                                            <div
                                                                                style={{
                                                                                    padding: "5px 10px",
                                                                                    borderRadius: "5px",
                                                                                    textAlign: "center",
                                                                                    width: "100%",
                                                                                    maxWidth: "200px",
                                                                                }}
                                                                            >
                                                                                <span style={{ color: "#0E3984", fontSize: "12px", fontWeight: "bold" }}>
                                                                                    Valid for only Family Members.
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>


                                                                </div>
                                                            )}



                                                            <div className="mt-2">
                                                                {couponCount > 0 ? (
                                                                    <>
                                                                        You have a maximum of <strong className="text-danger">{couponCount}</strong> coupons.
                                                                    </>
                                                                ) : (
                                                                    <span className="text-danger">Sorry, you have already used all your coupons for this hospital.</span>
                                                                )}
                                                            </div>
                                                        </div>



                                                        {couponCount > 0 ? (
                                                            <div className="w-100 mt-2">
                                                                <button
                                                                    className="btn btn-warning w-100"
                                                                    onClick={() => setShowModal(true)}
                                                                >
                                                                    Avail One Coupon →
                                                                </button>
                                                            </div>

                                                        ) : (
                                                            <div className="w-100 mt-2">
                                                                <button
                                                                    className="btn btn-warning w-100"
                                                                    onClick={() => setShowModal(true)}
                                                                >
                                                                    Request Coupon →
                                                                </button>
                                                            </div>
                                                        )}


                                                        {showModal && (
                                                            <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0, 0, 0, 0.5)" }}>
                                                                <div className="modal-dialog modal-dialog-centered" role="document">
                                                                    <div className="modal-content">

                                                                        <div className="modal-header d-flex justify-content-end">
                                                                            <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                                                        </div>






                                                                        <div className="p-3">

                                                                            <div className="col-md-12 mb-2">
                                                                                <div className="card mt-2 p-2 border shadow-sm rounded-2 bg-light" style={{ margin: "0 auto" }}>
                                                                                    <h5 className="modal-title text-center mb-2" style={{ color: "rgb(0, 102, 204)" }}>Coupon Details</h5>

                                                                                    <div className="d-flex align-items-center justify-content-between">
                                                                                        <div className="d-flex align-items-center">
                                                                                            <FontAwesomeIcon icon={faTicket} className="me-2" style={{ color: "rgb(0, 102, 204)", fontSize: "1.2rem" }} />
                                                                                            <span>Coupon: {couponCount}</span>
                                                                                        </div>
                                                                                        <span>
                                                                                            Coupon Value: ₹{amount}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {memberLoading ? (
                                                                                <div className="text-center my-5">
                                                                                    <div className="spinner-border text-primary" role="status">
                                                                                        <span className="visually-hidden">Loading...</span>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <>

                                                                                    {member && (
                                                                                        <div className="col-md-12 mb-3">
                                                                                            <div className="card border shadow-sm rounded-3">
                                                                                                <div className="card-body p-4 bg-light">
                                                                                                    <div className="d-flex justify-content-between align-items-center">
                                                                                                        <div>
                                                                                                            <div className="d-flex align-items-center mb-2">
                                                                                                                <i className="bi bi-person-circle me-2 text-primary" style={{ fontSize: '24px' }}></i>
                                                                                                                <p className="fs-6 mb-0 text-darkm fw-bold">{member.Name}</p>
                                                                                                            </div>
                                                                                                            <p className="text-muted mb-2 small">
                                                                                                                <span className="badge bg-secondary me-2">{member.Age}</span>
                                                                                                                {member.Relationship || "Self"}
                                                                                                            </p>
                                                                                                            <div className="d-flex align-items-center">
                                                                                                                <div className="d-flex align-items-center gap-2">
                                                                                                                    <div className={`rounded-circle p-1 ${memberCoupons[memberId] > 0 ? 'bg-success' : 'bg-secondary'}`} style={{ width: '10px', height: '10px' }}></div>
                                                                                                                    <span className="text-muted small">
                                                                                                                        {memberCoupons[memberId] > 0 ? 'Coupons Available' : 'No Coupons'}
                                                                                                                    </span>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        {memberCoupons[memberId] > 0 ? (
                                                                                                            <button
                                                                                                                className="btn btn-success d-flex align-items-center justify-content-center"
                                                                                                                onClick={() => handleHospitalConsultation(service.HospitalPoliciesId, member)}
                                                                                                            >
                                                                                                                <i className="bi bi-ticket-detailed me-2"></i>
                                                                                                                Avail Coupon
                                                                                                            </button>
                                                                                                        ) : (
                                                                                                            <a
                                                                                                                href="tel:7032107108" // Replace with the actual phone number
                                                                                                                className="btn btn-warning d-flex align-items-center justify-content-center"
                                                                                                            >
                                                                                                                <i className="bi bi-telephone me-2"></i>
                                                                                                                Request
                                                                                                            </a>
                                                                                                        )}

                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}

                                                                                    {dependents.map((dep, index) => (
                                                                                        <div key={index} className="col-md-12 mb-3">
                                                                                            <div className="card border shadow-sm rounded-3">
                                                                                                <div className="card-body p-4 bg-light">
                                                                                                    <div className="d-flex justify-content-between align-items-center">
                                                                                                        <div>
                                                                                                            <div className="d-flex align-items-center mb-2">
                                                                                                                <i className="bi bi-person-circle me-2 text-primary" style={{ fontSize: '24px' }}></i>
                                                                                                                <p className="fs-6 mb-0 text-dark fw-bold">{dep.name}</p>
                                                                                                            </div>
                                                                                                            <p className="text-muted mb-2 small">
                                                                                                                <span className="badge bg-secondary me-2">{dep.age}</span>
                                                                                                                {dep.relationship}
                                                                                                            </p>
                                                                                                            <div className="d-flex align-items-center">
                                                                                                                <div className="d-flex align-items-center gap-2">
                                                                                                                    <div className={`rounded-circle p-1 ${dependentCoupons[dep.customerId] > 0 ? 'bg-success' : 'bg-secondary'}`} style={{ width: '10px', height: '10px' }}></div>
                                                                                                                    <span className="text-muted small">
                                                                                                                        {dependentCoupons[dep.customerId] > 0 ? 'Coupons Available' : 'No Coupons'}
                                                                                                                    </span>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        {dependentCoupons[dep.customerId] > 0 ? (
                                                                                                            <button
                                                                                                                className="btn btn-success d-flex align-items-center justify-content-center"
                                                                                                                onClick={() => handleHospitalConsultation(service.HospitalPoliciesId, dep)}
                                                                                                            >
                                                                                                                <i className="bi bi-ticket-detailed me-2"></i>
                                                                                                                Avail Coupon
                                                                                                            </button>
                                                                                                        ) : (
                                                                                                            <a
                                                                                                                href="tel:7032107108" // Replace with the actual phone number
                                                                                                                className="btn btn-warning d-flex align-items-center justify-content-center"
                                                                                                            >
                                                                                                                <i className="bi bi-telephone me-2"></i>
                                                                                                                Request
                                                                                                            </a>
                                                                                                        )}

                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </>

                                                                            )}



                                                                        </div>




                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}


                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="card-text">
                                                            {service.DiscountPercentage > 0
                                                                ? `Enjoy a discount of ${service.DiscountPercentage}% on this service.`
                                                                : `No discounts available for this service.`}
                                                        </p>
                                                        <div className="w-100 mt-2">
                                                            <button className="btn btn-warning w-100" onClick={() => handleHospitalConsultationLab(service.HospitalPoliciesId)}>
                                                                Book Now →
                                                            </button>
                                                        </div>
                                                    </>
                                                )
                                            ) : (
                                                <p className="text-muted">This service is currently unavailable.</p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted text-center">No services available for this hospital.</p>
                            )}
                        </div>


                        <div className="col-md-12 md-6">
                            <div
                                style={containerStyle}
                                onMouseEnter={() => setIsHovering(true)}
                                onMouseLeave={() => setIsHovering(false)}
                            >
                                <div ref={containerRef} style={trackStyle}>
                                    <div style={textStyle}>
                                        {isCompleted ? 'Contacting...' : 'Need Help? Slide to contact customer care'}
                                    </div>
                                    <div
                                        ref={sliderRef}
                                        style={getSliderStyle()}
                                        onMouseDown={handleMouseDown}
                                        onTouchStart={handleTouchStart}
                                    >
                                        {isCompleted ? (
                                            <FontAwesomeIcon icon={faCheck} style={iconStyle} />
                                        ) : (
                                            <FontAwesomeIcon icon={faArrowRight} style={iconStyle} />
                                        )}
                                    </div>

                                </div>
                            </div>
                        </div>

                    </>
                )}

            </div>



        </div >
    );
};

export default HospitalServices;
