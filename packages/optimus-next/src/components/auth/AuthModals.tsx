'use client';

import { useState, useEffect } from 'react';
import { LoginModal } from './LoginModal';
import { RegisterModal } from './RegisterModal';

export type AuthModalType = 'login' | 'register' | null;

interface AuthModalsProps {
  activeModal: AuthModalType;
  onClose: () => void;
}

export default function AuthModals({ activeModal, onClose }: AuthModalsProps) {
  const [currentModal, setCurrentModal] = useState<AuthModalType>(activeModal);

  // 同步外部状态
  useEffect(() => {
    setCurrentModal(activeModal);
  }, [activeModal]);

  const handleSwitchToRegister = () => {
    setCurrentModal('register');
  };

  const handleSwitchToLogin = () => {
    setCurrentModal('login');
  };

  const handleClose = () => {
    setCurrentModal(null);
    onClose();
  };

  return (
    <>
      <LoginModal
        isOpen={currentModal === 'login'}
        onClose={handleClose}
        onSwitchToRegister={handleSwitchToRegister}
      />
      
      <RegisterModal
        isOpen={currentModal === 'register'}
        onClose={handleClose}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </>
  );
}