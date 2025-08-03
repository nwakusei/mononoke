// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// module.exports = nextConfig;

const nextConfig = {
  // suas configurações existentes, se houver
  typescript: {
    ignoreBuildErrors: true, // Essa setagem não existe por padrão. Inserida para ignorar erros de tipagem
  },
};

module.exports = {
  ...nextConfig,
  images: {
    ...nextConfig.images,
    domains: [
      "localhost",
      "backend",
      "mononokebucket.s3.us-east-1.amazonaws.com",
    ],
  },
};
