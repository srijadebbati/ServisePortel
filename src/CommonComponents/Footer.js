import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Footer = ({ memberId }) => {
    const [activeMenu, setActiveMenu] = useState("");

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.pathname.includes("Hospitals")) {
            setActiveMenu("Hospitals");
        } else if (location.pathname.includes("MyBookings")) {
            setActiveMenu("MyBookings");
        }
    }, [location]);

    const handleNavigate = (route) => {
        navigate(route, { state: { memberId } });
    };

    return (
        <div className='sticky-bottom bg-body-tertiary mt-auto'>
            <div className='d-flex flex-row justify-content-between align-items-center px-3'>
                <div
                    className="d-flex flex-column justify-content-center align-items-center fs-5"
                    style={{ cursor: "pointer", color: activeMenu === "Hospitals" ? "#0E94C3" : "inherit" }}
                    onClick={() => handleNavigate("/Hospitals")}
                >
                    <i className="bi bi-calendar-check"></i>
                    <span style={{ fontSize: "11px", marginTop: "2px" }}>Book Service</span>
                </div>

                <div
                    className="d-flex flex-column justify-content-center align-items-center fs-5"
                    style={{ cursor: "pointer", color: activeMenu === "MyBookings" ? "#0E94C3" : "inherit" }}
                    onClick={() => handleNavigate("/MyBookings")}
                >
                    <i className="bi bi-list-check"></i>
                    <span style={{ fontSize: "11px", marginTop: "2px" }}>My Bookings</span>
                </div>
            </div>
        </div>


    );
};

export default Footer;
