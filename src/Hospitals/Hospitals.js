import React, { useState, useEffect } from 'react';
import { fetchData } from '../Helpers/externapi';
import { useNavigate, useLocation } from 'react-router-dom';
import { debounce } from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faMapMarkerAlt, faPhone, faHospital, faCity } from '@fortawesome/free-solid-svg-icons'; // Import 
import Footer from '../CommonComponents/Footer';

const Hospitals = () => {
    const location = useLocation();
    const [members, setMembers] = useState([]);
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const { isFromBookService, memberId, fullName, gender, age, memberDependentId, distributorId, userId,
        dateofBirth, mobileNumber, address } = location.state || {};

    const navigate = useNavigate();

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

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const response = await fetchData('Hospital/all', { skip: 0, take: 0, IsActive: true });
            if (response) {
                setMembers(response);
                setFilteredData(response);
            }
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const debouncedSearch = debounce((query) => {
        if (query.trim() === '') {
            setFilteredData(members);
        } else {
            const filtered = members.filter((item) => {
                const name = item.HospitalName ? item.HospitalName.toLowerCase() : '';
                const mobileNumber = item.City ? item.City.toLowerCase() : '';
                return name.includes(query.toLowerCase()) || mobileNumber.includes(query);
            });
            setFilteredData(filtered);
        }
    });

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        debouncedSearch(query);
    };

    const navigateBack = () => {
        navigate(-1);
    };

    const handleViewCode = (hospital) => {
        navigate('/hospitalCode', { state: { hospital } });
    };

    const navigateToHospitalDetails = (hospital) => {
        navigate('/hospitalDetails', { state: { hospital } });
    };

    const handleHospitalConsultation = (hospital) => {
        navigate('/HospitalServices', {
            state: {
                fullName, gender, age, memberId, memberDependentId, distributorId, userId,
                dateofBirth, mobileNumber, address, hospitalId: hospital.HospitalId, hospitalName: hospital.HospitalName
            }
        });
    }


    const goBackToLogin = () => {
        const isConfirmed = window.confirm("Are you sure, You want to go back for Member Verification?");
        if (isConfirmed) {
            sessionStorage.removeItem('memberId');
            sessionStorage.removeItem('memberTime')
            navigate('/', {
                replace: true,
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
                <div className="bg-body-tertiary sticky-top d-flex flex-row justify-content-between align-items-center p-2 px-4">
                    <div className="d-flex flex-row justify-content-start align-items-center">
                        {/* <button
                            className="btn fs-3 p-0 me-3"
                            style={{ color: '#0E94C3' }}
                            onClick={() => navigateBack()}
                        >
                            <i className="bi bi-arrow-left-circle-fill"></i>
                        </button> */}
                        <h5>SELECT HOSPITAL</h5>
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

                {/* Search Input with Icon */}
                <div className="p-3">
                    <div className="input-group mb-2">
                        <input
                            type="text"
                            placeholder="Search by Hospitl Name or City"
                            className="form-control"
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                        <span className="input-group-text">
                            <FontAwesomeIcon icon={faSearch} color="rgb(0, 149, 182)" />
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="d-flex flex-row justify-content-center pt-5">
                        <div className="spinner-border text-info" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <div
                        className="d-flex flex-column  flex-grow-1 p-3 pb-5"
                        style={{ overflowY: 'scroll', height: 'calc(100vh - 150px)' }}
                    >


                        {filteredData && filteredData.length > 0 ? (
                            filteredData.map((member) => (
                                <div
                                    key={member.HospitalId}
                                    onClick={() => {
                                        handleHospitalConsultation(member);
                                    }}
                                    className="card flex-column p-3 mb-3 rounded shadow-sm"
                                    style={{
                                        background: '#FFFFFF',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {/* Hospital Name */}
                                    <h6 className="text-primary d-flex align-items-center">
                                        <FontAwesomeIcon
                                            icon={faHospital}
                                            style={{ marginRight: '8px', color: 'rgb(0, 149, 182)' }}
                                        />
                                        {member.HospitalName}
                                    </h6>

                                    {/* Address */}
                                    <p style={{ fontSize: '12px', color: '#555', maxWidth: '350px' }}>
                                        <FontAwesomeIcon
                                            icon={faMapMarkerAlt}
                                            style={{ marginRight: '8px', color: 'rgb(0, 149, 182)' }}
                                        />
                                        {member.AddressLine1}
                                    </p>

                                    <p style={{ fontSize: '12px', color: '#555' }}>
                                        <FontAwesomeIcon
                                            icon={faCity}
                                            style={{ marginRight: '8px', color: 'rgb(0, 149, 182)' }}
                                        />
                                        {member.City}
                                    </p>


                                </div>
                            ))
                        ) : (
                            <div className="text-center">No members found.</div>
                        )}
                    </div>
                )}



                <div
                    style={{
                        position: 'sticky',
                        bottom: '50px',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        width: '100%',
                    }}
                >
                    <button
                        style={{
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: windowSize.width < 576 ? '50px' : '60px',
                            height: windowSize.width < 576 ? '50px' : '60px',
                            backgroundColor: '#0E94C3',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '28px',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                            cursor: 'pointer',
                            zIndex: 1000, // Ensures it stays above the content
                        }}
                        onClick={() => goBackToLogin()}
                    >
                        <i className="bi bi-house-door me-1"></i>
                    </button>
                </div>


                <Footer memberId={memberId} />

            </div>




        </div>
    );
};

export default Hospitals;
