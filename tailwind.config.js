/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['PlusJakartaSans_400Regular', 'sans-serif'],
        'sans-medium': ['PlusJakartaSans_500Medium', 'sans-serif'],
        'sans-semibold': ['PlusJakartaSans_600SemiBold', 'sans-serif'],
        'sans-bold': ['PlusJakartaSans_700Bold', 'sans-serif'],
        'sans-extrabold': ['PlusJakartaSans_800ExtraBold', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#00DF81', // Caribbean Green
          dark: '#03624C', // Bangladesh Green
          light: '#2CC295', // Mountain Meadow
        },
        secondary: {
          DEFAULT: '#F1F7F6', // Anti-Flash White
          dark: '#032221', // Dark Green
        },
        turf: {
          bg: '#F1F7F6',
          text: '#032221',
          black: '#000F11', // Rich Black (approx from hex typo)
        }
      },
    },
  },
  plugins: [],
}
