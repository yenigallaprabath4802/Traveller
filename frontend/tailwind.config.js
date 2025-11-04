/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'travel-blue': '#0EA5E9',
        'travel-orange': '#F97316',
        'travel-green': '#10B981',
        'sunset': '#FF6B35',
        'ocean': '#006A6B',
        'sand': '#F4E4BC',
      },
      backgroundImage: {
        'travel-gradient': 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 50%, #10B981 100%)',
        'sunset-gradient': 'linear-gradient(135deg, #FF6B35 0%, #F97316 100%)',
        'hero-pattern': "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"4\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
      },
      keyframes: {
        airplane: {
          '0%': { transform: 'translateX(0) translateY(0) rotate(10deg)', opacity: '0' },
          '10%': { opacity: '1' },
          '50%': { transform: 'translateX(600px) translateY(-50px) rotate(10deg)', opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateX(1200px) translateY(-100px) rotate(15deg)', opacity: '0' },
        },
        clouds: {
          '0%': { transform: 'translateX(-200px)', opacity: '0.6' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateX(1200px)', opacity: '0.6' },
        },
        floatCloud: {
          '0%': { transform: 'translateX(-200px)' },
          '100%': { transform: 'translateX(120vw)' },
        },
        floatCloudDelay: {
          '0%': { transform: 'translateX(-250px)' },
          '100%': { transform: 'translateX(130vw)' },
        },
        floatCloudSlow: {
          '0%': { transform: 'translateX(-150px)' },
          '100%': { transform: 'translateX(110vw)' },
        },
      },
      animation: {
        airplane: 'airplane 20s linear infinite',
        clouds: 'clouds 60s linear infinite',
        floatCloud: 'floatCloud 70s linear infinite',
        floatCloudDelay: 'floatCloudDelay 80s linear infinite',
        floatCloudSlow: 'floatCloudSlow 90s linear infinite',
      },
    },
  },
  plugins: [],
}
