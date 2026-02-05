// pages/_app.js
import Layout from '@/src/layout/Layout';
import '@/styles/globals.css';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const noLayoutRoutes = ['/'];

  const isNoLayout = noLayoutRoutes.includes(router.pathname.toLowerCase());

  return isNoLayout ? (
    <Component {...pageProps} />
  ) : (
       <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
