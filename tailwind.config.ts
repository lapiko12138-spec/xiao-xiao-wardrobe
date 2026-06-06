import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#fbfaf4",
          100: "#f5f2e7",
          200: "#ebe6d6"
        },
        leaf: {
          50: "#eef6e6",
          100: "#dfeccd",
          300: "#b9ce8e",
          500: "#91ad62",
          700: "#617a3a"
        },
        ink: "#22241f",
        muted: "#8d9186"
      },
      boxShadow: {
        phone: "0 18px 55px rgba(133, 155, 103, 0.2)",
        soft: "0 12px 28px rgba(121, 128, 112, 0.09)"
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "PingFang SC",
          "Microsoft YaHei",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};

export default config;
