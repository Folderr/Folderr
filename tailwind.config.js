// eslint-disable-next-line unicorn/prefer-module
module.exports = {
	theme: {
		extend: {
			colors: {
				brand: '#2ECC71',
				'brand-darkened': '#2ba05c', // #1A6137
				'secondary-brand': '#81B5D9', // '#B8E1FF',
				bg: '#282828',
				'bg-old': '#313131',
				'secondary-bg': '#131313',
				'tertiary-bg': '#393939',
				text: '#FFFFFF',
				'secondary-text': '#C4C4C4',
				'secondary-accent': '#C5395B',
				'secondary-accent-dark': '#A91F40',
				disabled: '#757575',
				'disabled-red': '#590015',
			},
			screens: {
				lg: '1024px',
				'2xl': '1536px',
				'3xl': '2400px',
			},
		},
		fontFamily: {
			headline: ['Raleway'],
			info: ['"Open Sans"'],
			input: ['"Jetbrains Mono"', 'sans-serif'],
		},
	},
	plugins: [],
	content: ['src/**/*.vue', 'src/**/**/*.vue'],
};
