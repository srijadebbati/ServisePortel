import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

const ProtectedRoute = () => {
    const navigate = useNavigate();
    const memberTime = sessionStorage.getItem('memberTime');    

    React.useEffect(() => {
        const currentTime = new Date().getTime();
        const parsedMemberTime = memberTime ? parseInt(memberTime, 10) : null;
    
        // Set expiration time dynamically (current time + 2 hours)
        const expirationTime = parsedMemberTime ? parsedMemberTime + 120 * 60 * 1000 : null;
    
        if (!parsedMemberTime) {
            navigate("/", { replace: true });
        } else if (currentTime >= expirationTime) {
            sessionStorage.removeItem('memberId');
            sessionStorage.removeItem('memberTime');
            navigate("/verify", { replace: true });
        } 
    }, [memberTime, navigate]);
    

    return <Outlet />;
};

export default ProtectedRoute;
