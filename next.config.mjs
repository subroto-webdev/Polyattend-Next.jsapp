import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },

  // pdfkit ke webpack bundling theke bad dewa hocche, karon webpack eta
  // bundle korar somoy .afm font-metric file gulo thikmoto copy kore na
  // (fole runtime e "ENOENT ... Helvetica.afm" error hoy). Ei option
  // pdfkit ke sadharon Node.js require() diye load korte bole, jate
  // node_modules theke sorasori .afm file gulo pora jay.
  experimental: {
    serverComponentsExternalPackages: ['pdfkit'],
  },
};

const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

export default withPWAConfig(nextConfig);