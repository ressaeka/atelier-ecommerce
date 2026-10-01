import { registerAs } from '@nestjs/config';

/**
 * Konfigurasi Midtrans.
 *
 * Tiga URL yang HARUS dibedakan:
 *
 * A. Frontend return URL (browser user setelah bayar)
 *    → FRONTEND_URL + /payment/success/:orderId
 *    → dikirim via Snap API property `callbacks.finish`
 *
 * B. Notification webhook (Midtrans → Backend, POST)
 *    → diatur di Midtrans Dashboard (Notification URL)
 *    → contoh: https://<ngrok>/api/v1/payment/notification
 *    → JANGAN diisi URL frontend
 *
 * C. Snap payment page (redirectUrl dari API response)
 *    → https://app.sandbox.midtrans.com/snap/v4/redirection/...
 */
export default registerAs('midtrans', () => ({
  merchantId: process.env.MIDTRANS_MERCHANT_ID,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',

  // A. Frontend base URL untuk Snap `callbacks.finish` (browser return)
  frontendUrl: (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(
    /\/+$/,
    '',
  ),

  // B. Documentation reference untuk webhook (diatur di Dashboard).
  //    Tidak dikirim sebagai property body Snap — Snap API tidak mendukungnya.
  notificationUrl: (process.env.MIDTRANS_NOTIFICATION_URL ?? '').replace(
    /\/+$/,
    '',
  ),
}));
