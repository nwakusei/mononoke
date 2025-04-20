// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// module.exports = nextConfig;

const nextConfig = {
	// suas configurações existentes, se houver
};

module.exports = {
	...nextConfig,
	images: {
		...nextConfig.images,
		domains: ["localhost"],
	},
};
