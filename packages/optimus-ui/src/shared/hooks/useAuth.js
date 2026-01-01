import { useCallback, useEffect, useState } from "react";
import { login as loginApi, getCaptchaImage } from "../../apis/user";
import storage from "../utils/storage";

export const initUserProfile = () => {
  try {
    return JSON.parse(storage("user")) || {};
  } catch (error) {
    return {};
  }
};

export default function useAuth() {
  const [captchaImaBase64, setCaptchaImaBase64] = useState({
    id: "",
    base64: "",
  });
  const [isLogin, setIsLogin] = useState(storage("access-token"));
  const [accessToken, setAccessToken] = useState(storage("access-token"));
  const [userInfo, setUserInfo] = useState(initUserProfile());
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!storage("access-token"));
  const login = useCallback(
    async (data) => {
      return await loginApi({
        captchaId: captchaImaBase64?.id || "",
        ...data,
      });
    },
    [captchaImaBase64],
  );

  const logout = useCallback(() => {
    storage("access-token", "");
    storage("refresh-token", "");
    storage("user", "");
    setIsAuthenticated(false);
  }, []);

  const onLoginChange = useCallback(() => {
    const token = storage("access-token");
    setIsLogin(token);
    setAccessToken(token);
    setUserInfo(initUserProfile());
    setIsAuthenticated(!!token);
  }, []);

  const onChangeCaptchaImage = useCallback(() => {
    getCaptchaImage().then(({ data = {} }) => {
      setCaptchaImaBase64({
        id: data?.id || "",
        base64: data?.img || "",
      });
    }).catch((error) => {
      console.error('获取验证码失败:', error);
      setCaptchaImaBase64({
        id: "",
        base64: "",
      });
    });
  }, [setCaptchaImaBase64]);

  // 开发环境自动登录
  const autoLoginInDev = useCallback(async () => {
    if (process.env.NODE_ENV === 'development' &&
      process.env.REACT_APP_DEV_AUTO_LOGIN_ENABLED === 'true' &&
      !isLogin && !isAutoLoggingIn) {

      const devAccount = process.env.REACT_APP_DEV_AUTO_LOGIN_ACCOUNT;
      const devPassword = process.env.REACT_APP_DEV_AUTO_LOGIN_PASSWORD;

      if (devAccount && devPassword) {
        setIsAutoLoggingIn(true);
        try {


          // 先获取验证码
          const captchaRes = await getCaptchaImage();
          if (captchaRes.success) {
            setCaptchaImaBase64({
              id: captchaRes.data?.id || "",
              base64: captchaRes.data?.img || "",
            });

            // 执行登录，使用固定验证码
            const loginRes = await loginApi({
              account: devAccount,
              password: devPassword,
              verifyCode: '0000', // 开发环境使用固定验证码
              captchaId: captchaRes.data?.id || "",
            });

            if (loginRes.success) {
              onLoginChange();
            } else {
              onChangeCaptchaImage();
            }
          }
        } catch (error) {
          onChangeCaptchaImage();
        } finally {
          setIsAutoLoggingIn(false);
        }
      }
    }
  }, [isLogin, isAutoLoggingIn, onLoginChange, onChangeCaptchaImage]);

  useEffect(() => {
    // 未登录情况下的处理
    if (!isLogin && !isAutoLoggingIn) {
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEV_AUTO_LOGIN_ENABLED === 'true') {
        // 开发环境先尝试自动登录
        autoLoginInDev();
      } else {
        // 生产环境或未启用自动登录时，正常获取验证码
        onChangeCaptchaImage();
      }
    }

    window.addEventListener("setItemEvent", onLoginChange);
    return () => {
      window.removeEventListener("setItemEvent", onLoginChange);
    };
  }, [isLogin, onChangeCaptchaImage, onLoginChange, autoLoginInDev, isAutoLoggingIn]);

  return {
    userInfo,
    isLogin,
    logout,
    login,
    accessToken,
    captchaImaBase64,
    onChangeCaptchaImage,
    isAutoLoggingIn,
    isAuthenticated,
  };
}
