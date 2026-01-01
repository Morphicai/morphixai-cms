import React, { createContext, useState } from "react";
import { initUserProfile } from "../hooks/useAuth";

const globalContext = createContext({});
const { Provider, Consumer } = globalContext;

const GlobalProvider = ({ children }) => {
    // TODO: merge useAuth
    const [userInfo, setUserInfo] = useState(initUserProfile);
    const [shouldUpdate, forceUpdate] = useState(0);
    const refresh = () => forceUpdate(new Date().valueOf());
    const setUserProfile = (user) => setUserInfo(user);
    const initValue = {
        userInfo,
        shouldUpdate,
        refresh,
        setUserProfile,
    };
    return <Provider value={initValue}>{children}</Provider>;
};

export { globalContext, GlobalProvider, Consumer as GlobalConsumer };
