import React, { useState, useEffect, useCallback } from 'react';
import { fetchData, fetchAllData } from '../Helpers/externapi';
import Footer from '../CommonComponents/Footer';
import { useNavigate, useLocation } from 'react-router-dom';
import { debounce } from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faMapMarkerAlt, faPhone, faTimes } from '@fortawesome/free-solid-svg-icons'; // Import the icons
import { ConstructionOutlined } from '@mui/icons-material';
import { faExclamationTriangle, faCheckCircle } from "@fortawesome/free-solid-svg-icons";


const ConsultationList = () => {
    const location = useLocation();
    const [members, setMembers] = useState([]);

    const { fullName, age, gender, memberId, address, dateofBirth, mobileNumber, memberDependentId, hospitalId, hospitalName, service, bookingConsultationId } = location.state;
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const [activeTab, setActiveTab] = useState('Booked');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const UserId = sessionStorage.getItem('UserId');
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');


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

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const endpoint = `lambdaAPI/BookingConsultation/PendingAndSuccessConsultationList`

            const response = await fetchData(endpoint, { CustomerId: memberId });

            // const sortedAppointments = response.sort((a, b) => {
            //     const dateA = new Date(a.AppointmentDate);
            //     const dateB = new Date(b.BookingDate);

            //     return dateB.getTime() - dateA.getTime();
            // });

            setAppointments(response);

            filterAppointmentsData(response, activeTab, searchQuery);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    useEffect(() => {
        filterAppointmentsData(appointments, activeTab, searchQuery);
    }, [activeTab, searchQuery, appointments]);

    const getStatusColor = (date) => {
        const appointmentDate = new Date(date);
        const today = new Date();

        if (appointmentDate < today) return '#FF6B6B';
        if (appointmentDate.toDateString() === today.toDateString()) return '#4ECDC4';
        return '#45B7D1';
    };


    const filterAppointmentsData = (appointments, tab, query = '') => {
        if (!appointments) return;

        let filtered = appointments.filter(appointment => {
            switch (tab) {
                case 'Booked':
                    return appointment.IsCouponClaimed === true;
                case 'Initiated':
                    return !appointment.IsCouponClaimed;
                default:
                    return false;
            }
        });

        if (query.trim()) {
            const searchTerms = query.toLowerCase().trim().split(' ');
            filtered = filtered.filter(appointment => {
                const searchableText = `
                    ${appointment.HospitalName?.toLowerCase() || ''}
                    ${appointment.Name?.toLowerCase() || ''}
                    ${appointment.ServiceName?.toLowerCase() || ''}
                    ${appointment.CardNumber?.toLowerCase() || ''}
                    ${appointment.Appointment?.toLowerCase() || ''}
                `;

                return searchTerms.every(term => searchableText.includes(term));
            });
        }

        setFilteredAppointments(filtered);
    };



    const getStatusStyles = (status) => {
        switch (status) {
            case "Initiated":
                return {
                    backgroundColor: "#ffc107", // Bootstrap Warning (Yellow)
                    icon: faExclamationTriangle, // Warning Icon
                    iconColor: "#856404", // Dark Yellow for visibility
                    badgeTextColor: "#856404" // Dark Yellow for badge text
                };
            case "Booked":
                return {
                    backgroundColor: "#28a745", // Bootstrap Success (Green)
                    icon: faCheckCircle, // Success Check Icon
                    iconColor: "#ffffff", // White for contrast
                    badgeTextColor: "#ffffff" // White for badge text
                };
            default:
                return {
                    backgroundColor: "#FF6B6B", // Default (Red)
                    icon: faExclamationTriangle, // Default Warning
                    iconColor: "#ffffff",
                    badgeTextColor: "#ffffff"
                };
        }
    };



    const handleInitiatedClick = (item) => {
        navigate("/hospitalConsulationForm", {
            state: { bookingConsultationId: item.BookingConsultationId, service: item.HospitalPoliciesId , memberId}
        });
            

    }




    const renderAppointmentItem = (item) => {
        const appointmentDate = new Date(item.AppointmentDate);

        const { backgroundColor, icon, iconColor, badgeTextColor } = getStatusStyles(item.StatusName);

        return (
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                backgroundColor: 'white',
                borderRadius: '5px',
                marginBottom: '16px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                cursor: item.StatusName === "Initiated" ? "pointer" : "default",
            }}
            
            onClick={() => {
                if (item.StatusName === "Initiated") {
                    handleInitiatedClick(item);
                }
            }}>
                <div style={{
                    width: '4px',
                    borderTopLeftRadius: '16px',
                    borderBottomLeftRadius: '16px',
                    backgroundColor: '#FF6B6B'
                }} />
                <div style={{ flex: 1, padding: '16px' }}>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px'
                    }}>

                        <span style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#2D3436',
                            flex: 1,
                            marginRight: '8px',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <i className="bi bi-person-fill" style={{ marginRight: '6px', color: '#0E94C3' }}></i>
                            {item.Name} ({item.Gender}, {item.Age})
                        </span>


                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            backgroundColor,
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontWeight: "600",
                            color: badgeTextColor
                        }}>
                            <FontAwesomeIcon icon={icon} style={{ color: iconColor, marginRight: "6px" }} />
                            <span>{item.StatusName}</span>
                        </div>



                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <i className="bi bi-calendar-event-fill" style={{ marginRight: '6px', color: '#0E94C3' }}></i>
                        <span style={{ fontSize: '14px', color: '#2D3436' }}>
                            {appointmentDate.toLocaleDateString('en-US', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })}
                        </span>
                    </div>

                    {/* Hospital Name Row */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px'
                    }}>
                        <span style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#2D3436',
                            flex: 1,
                            marginRight: '8px',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <i className="bi bi-hospital-fill" style={{ marginRight: '6px', color: '#0E94C3' }}></i>
                            {item.HospitalName}
                        </span>

                        {/* Service Type Badge */}
                        {item.ServiceType &&
                            <div style={{
                                padding: '6px 12px',
                                borderRadius: '20px',
                                backgroundColor: '#FF6B6B'
                            }}>
                                <span style={{
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#FFFFFF'
                                }}>
                                    {item.ServiceType}
                                </span>
                            </div>
                        }
                    </div>
                </div>
            </div>


        );
    };


    const handleSearch = (event) => {
        const value = event.target.value;
        setSearchQuery(value);
        filterAppointmentsData(appointments, activeTab, value);
    };

    const clearSearch = () => {
        setSearchQuery('');
        filterAppointmentsData(appointments, activeTab, '');
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
                <div className="bg-body-tertiary sticky-top d-flex flex-row justify-content-between align-items-center p-2 px-4">
                    <div className='d-flex flex-row justify-content-start align-items-center'>
                        {/* <button className='btn fs-3 p-0 me-3' style={{ color: '#0E94C3' }}
                            onClick={() => navigateBack()}>
                            <i className="bi bi-arrow-left-circle-fill" ></i>
                        </button> */}
                        <h5>Hospital Appointments</h5>
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

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    padding: '15px 0',
                    backgroundColor: 'white',
                    // position: 'sticky',
                    top: '0',
                    zIndex: '10',
                    marginTop: '2px'
                }}>
                    {['Booked', 'Initiated'].map((tab) => (
                        <button
                            key={tab}
                            style={{
                                padding: '5px 30px',
                                textAlign: 'center',
                                borderRadius: '25px',
                                backgroundColor: '#F8F9FA',
                                border: 'none',
                                ...(activeTab === tab && { backgroundColor: '#45B7D1', color: 'white' })
                            }}
                            onClick={() => {
                                setActiveTab(tab);
                                filterAppointmentsData(appointments, tab, searchQuery);
                            }}

                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
                    <div className="input-group mb-3" style={{ maxWidth: '600px', width: '100%' }}>
                        <span className="input-group-text">
                            <FontAwesomeIcon icon={faSearch} />
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search appointments..."
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                        {searchQuery && (
                            <button className="btn btn-outline-secondary" onClick={clearSearch}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        )}
                    </div>
                </div>





                <div style={{
                    paddingBottom: '24px',
                    overflowY: 'scroll',
                }}>
                    {loading ? (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '50px 0'
                        }}>
                            <div className="spinner" />
                            <span style={{ color: '#6C757D', fontSize: '16px' }}>
                                {('Loading appointments')}...
                            </span>
                        </div>
                    ) : (
                        <div style={{ padding: '16px', paddingBottom: '24px' }}>
                            {filteredAppointments.length === 0 ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: '20px'
                                }}>
                                    <div style={{ fontSize: '60px', color: '#4CAF50' }}>&#x1F4C5;</div>
                                    <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: "#333", textAlign: 'center' }}>
                                        {("No appointments found")}
                                    </h2>
                                    <p style={{ fontSize: '16px', color: '#666', textAlign: 'center' }}>
                                        {("Try searching again later or check back soon.")}
                                    </p>
                                </div>
                            ) : (
                                filteredAppointments.map(item => renderAppointmentItem(item))
                            )}
                        </div>
                    )}
                </div>


                <Footer memberId={memberId} />



            </div>
        </div>
    );
};

export default ConsultationList;
