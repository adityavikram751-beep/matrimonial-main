import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

export default function LogoutScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');

      localStorage.removeItem('token'); 
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative w-full h-screen">
      
      <Image
        src="/bg.png"
        alt="Logging out"
        fill
        className="object-cover blur-sm"
        priority
      />

      <div className="absolute inset-0  bg-opacity-50 flex items-center justify-center">
        <div className=" bg-opacity-10 backdrop-blur-md px-8 py-8 rounded-xl text-center shadow-2xl border border-white/20">
          <h1 className="text-white text-xl font-semibold mb-4">Logging Out</h1>

 
          <div className="flex items-center justify-center space-x-2">
            <span className="w-3 h-3 bg-white rounded-full animate-bounce" />
            <span className="w-3 h-3 bg-white rounded-full animate-bounce delay-200" />
            <span className="w-3 h-3 bg-white rounded-full animate-bounce delay-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
