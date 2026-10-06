import ProfilePage from '../../components/profile/ProfilePage';

/**
 * Admin Profile (/admin/profile)
 * Thin wrapper around shared ProfilePage — same UX as User Profile.
 * Email is read-only. PATCH /users/me via AuthContext.updateProfile.
 */
export default function AdminProfile() {
  return (
    <ProfilePage
      eyebrow="Admin · Account"
      accountLabel="admin account"
    />
  );
}
