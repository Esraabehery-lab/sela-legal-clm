/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["nodemailer"],
    serverActions: {
      // Allow uploading a revised contract file (PDF/DOCX) as a data URL.
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
