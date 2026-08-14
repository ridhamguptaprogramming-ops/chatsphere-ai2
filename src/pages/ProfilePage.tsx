import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileView } from '../components/profile/ProfileView';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  return <ProfileView onBack={() => navigate('/chat')} />;
};
