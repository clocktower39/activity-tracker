import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router';
import dayjs from 'dayjs';
import { getActivities, loginJWT } from '../Redux/actions';
import Loading from './Loading';

export const AuthRoute = (props) => {
    const { socket } = props;

    const dispatch = useDispatch();
    const user = useSelector(state => state.user);
    const activityLoaded = useSelector(state => state.activityLoaded);
    const [loading, setLoading] = useState(true);
    const bootstrappedRef = useRef(false);


    const handleLoginAttempt = async (e) => {
        dispatch(loginJWT(localStorage.getItem('JWT_AUTH_TOKEN'))).then(()=>setLoading(false));
    }

    useEffect(()=>{
        if (user?.email) {
            setLoading(false);
            return;
        }

        if (localStorage.getItem('JWT_REFRESH_TOKEN') !== null) {
            handleLoginAttempt();
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line
    },[])

    useEffect(() => {
        if (!user?.email || activityLoaded || bootstrappedRef.current) return;
        bootstrappedRef.current = true;
        dispatch(getActivities(dayjs.utc().format('YYYY-MM-DD')));
    }, [dispatch, user?.email, activityLoaded]);

    return loading?<Loading />:user.email?<Outlet socket={socket} />:<Navigate to={{ pathname: '/login'}} />;
}

export default AuthRoute
