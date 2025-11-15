import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async redirects() {
        return [
            {
                source: '/',
                destination: '/dashboard/requests',
                permanent: true,
            },
        ]
    },
};

export default nextConfig;
