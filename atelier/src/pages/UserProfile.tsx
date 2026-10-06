import ProfilePage from '../components/profile/ProfilePage';

/**
 * User Profile (/profile)
 * Same UI pattern as Admin Profile — only route + auth context differ.
 * Email is read-only. PATCH /users/me via AuthContext.updateProfile.
 */
export default function UserProfile() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <ProfilePage eyebrow="Account" accountLabel="account" />
    </div>
  );
}
