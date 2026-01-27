const { Colors } = require("./constants/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./utils/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: Colors.background,
        foreground: Colors.foreground,
        "muted-foreground": Colors.mutedForeground,
        secondary: Colors.secondary,
        accent: Colors.accent,
        border: Colors.border,
        input: Colors.input,
      },
      borderRadius: {
        sm: ".25rem",
        md: ".375rem",
        lg: ".5rem",
        xl: ".75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2.5rem",
      },
      borderWidth: {
        DEFAULT: "1.4px",
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["17px", { lineHeight: "28px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["25px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "36px" }],
        "4xl": ["36px", { lineHeight: "40px" }],
        "5xl": ["48px", { lineHeight: "1" }],
        "6xl": ["60px", { lineHeight: "1" }],
        "7xl": ["72px", { lineHeight: "1" }],
      },
      fontFamily: {
        'lausanne-light': ["TWKLausanne-300"],
        'lausanne-regular': ["TWKLausanne-400"],
        "lausanne-medium": ["TWKLausanne-500"],
        "lausanne-semibold": ["TWKLausanne-600"],
        "lausanne-bold": ["TWKLausanne-700"],
        "lausanne-extrabold": ["TWKLausanne-800"],
      },
    },
  },
  plugins: [],
};
