import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import UserDetailCard from '@/src/component/manageusers/UserView';
import { API_URL } from '@/src/component/api/apiURL';

export default function UserDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [user, setUser] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`${API_URL}/admin/user/${id}`)
        .then(res => {
          if (!res.ok) throw new Error('User not found');
          return res.json();
        })
        .then(data => setUser(data))
        .catch(() => {
          setNotFound(true);
          setTimeout(() => router.push('/manageusers'), 2000);
        });
    }
  }, [id]);

  if (notFound) {
    return <div>User not found, redirecting...</div>;
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Link href="/manageusers">
        <div className="flex items-center gap-2 mb-4">
          <button className="bg-gray-50 hover:bg-gray-100 rounded-md p-2">
            <span className="text-2xl cursor-pointer">←</span>
          </button>
          <span>Back to Users</span>
        </div>
      </Link>

      <UserDetailCard user={user} />
    </>
  );
}
