import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProfilePage from '../components/profile/ProfilePage';

/**
 * User Profile (/profile)
 * Same UI pattern as Admin Profile — only route + auth context differ.
 * Email is read-only. PATCH /users/me via AuthContext.updateProfile.
 */
export default function UserProfile() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F5]">
      <Navbar />

      <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto w-full max-w-[1100px]">
          <ProfilePage eyebrow="Account" accountLabel="account" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
