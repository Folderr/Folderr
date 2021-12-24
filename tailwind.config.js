// eslint-disable-next-line unicorn/prefer-module
module.exports = {
	theme: {
		extend: {
			colors: {
				brand: '#2ECC71',
				'brand-darkened': '#2ba05c',
				bg: '#313131',
				'secondary-bg': '#131313',
				'tertiary-bg': '#393939',
				text: '#FFFFFF',
				'secondary-text': '#C4C4C4',
				'secondary-accent': '#C5395B',
			},
		},
		screens: {
			sm: '640px',
			md: '768px',
			lg: '1024px',
			xl: '1280px',
			'2xl': '1536px',
			'3xl': '2500px',
		},
	},
	plugins: [],
	content: ['src/**/*.vue', 'src/**/**/*.vue'],
};
