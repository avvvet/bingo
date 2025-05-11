import adapter from '@sveltejs/adapter-node';

const config = {
	kit: {
		adapter: adapter({
			out: 'build' // this is the default output folder
		})
	}
};

export default config;
