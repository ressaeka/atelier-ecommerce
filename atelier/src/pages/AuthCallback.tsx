import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleGoogleAuth } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      handleGoogleAuth(accessToken, refreshToken)
        .then(() => {
          navigate('/', { replace: true });
        })
        .catch((err) => {
          console.error('Gagal autentikasi Google:', err);
          navigate('/login', { replace: true });
        });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, handleGoogleAuth, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF9F5]">
      <div className="text-center">
        <p
          className="text-[20px] font-normal tracking-[0.04em] text-[#1A1A1A] mb-2"
          style={{ fontFamily: "'Libre Bodoni', 'Playfair Display', Georgia, serif" }}
        >
          ATELIER
        </p>
        <p className="text-[12px] tracking-[0.14em] uppercase text-[#888]">
          Memproses autentikasi...
        </p>
      </div>
    </div>
  );
}

