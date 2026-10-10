import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { consumeGuestAuthReturnIntent } from '../lib/guestIntent';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleGoogleAuth, exchangeOAuthCode } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const code = searchParams.get('code');
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    const handleSuccess = (authenticatedUser: { role: string }) => {
      // Role from existing auth response — ADMIN does not enter storefront via Google customer flow
      if (authenticatedUser.role === 'ADMIN') {
        navigate('/login/admin', { replace: true });
        return;
      }

      // Return-only intent — no auto wishlist/cart API
      const returnIntent = consumeGuestAuthReturnIntent();

      if (returnIntent) {
        navigate(returnIntent.returnTo, { replace: true });
        return;
      }

      navigate('/', { replace: true });
    };

    const handleError = (err: unknown) => {
      console.error('Gagal autentikasi Google:', err);
      navigate('/login', { replace: true });
    };

    if (code) {
      exchangeOAuthCode(code)
        .then(handleSuccess)
        .catch(handleError);
    } else if (accessToken && refreshToken) {
      handleGoogleAuth(accessToken, refreshToken)
        .then(handleSuccess)
        .catch(handleError);
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, handleGoogleAuth, exchangeOAuthCode, navigate]);

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

