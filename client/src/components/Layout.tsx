import { ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  admin?: boolean;
}

export default function Layout({ children, admin = false }: LayoutProps) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (admin) {
      api
        .getMe()
        .then(() => setAuthenticated(true))
        .catch(() => {
          setAuthenticated(false);
          navigate('/admin/login');
        });
    } else {
      setAuthenticated(true);
    }
  }, [admin, navigate]);

  if (authenticated === null) {
    return <div>Loading...</div>;
  }

  if (admin && !authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header admin={admin} />
      <main className="flex-grow">{children}</main>
      {!admin && <Footer />}
    </div>
  );
}

