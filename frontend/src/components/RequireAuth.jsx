import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const RequireAuth = ({ children }) => {
    const location = useLocation();

    // Check for auth_token in URL (from OAuth redirect)
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('auth_token');

    if (urlToken) {
        localStorage.setItem('token', urlToken);
    }

    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default RequireAuth;
