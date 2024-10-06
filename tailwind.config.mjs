/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        body: ["Roboto Mono", "sans-serif"],
        heading: ["Roboto Mono", "sans-serif"],
      },
      colors: {
        text: {
          body: "#ebdbb2",
          link: "#7daea3",
          code: "#a9b665",
          selection: "#ebdbb2",
        },
        bg: {
          body: "#1d2021",
          code: "#1d2021",
          selection: "#d3869b",
        },
        border: {
          code: "#a9b665",
        },
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: "#ebdbb2",
            a: {
              color: theme("colors.text.body"),
              "text-decoration": "none",
              "background-repeat": "no-repeat",
              "background-size": "100% 1.5px",
              "background-position": "0 100%",
              "background-image":
                "linear-gradient(to right, rgb(var(--color-text-link)/1), rgb(var(--color-text-link)/1))",
              "&:hover": {
                color: theme("colors.text.link"),
              },
            },
            "h1, h2, h3, h4, h5, h6": {
              color: "#ebdbb2",
            },
            "strong, b": {
              "font-weight": 1000,
              color: theme("colors.text.body"),
            },
            "th, blockquote": {
              color: theme("colors.text.body"),
            },
            "code::before": {
              content: "none",
            },
            "code::after": {
              content: "none",
            },
            blockquote: {
              border: "none",
              position: "relative",
              width: "96%",
              margin: "0 auto",
              "font-size": "1.0625em",
              "padding-top": "1.5rem",
              "padding-bottom": "0.5rem",
              "padding-left": "1.5rem",
              "padding-right": "1.5rem",
            },
            "blockquote::before": {
              "font-family": "Arial",
              content: "'“'",
              "font-size": "4em",
              color: "rgb(var(--color-text-link))",
              position: "absolute",
              left: "-10px",
              top: "-10px",
            },
            "blockquote::after": {
              content: "",
            },
            "blockquote p:first-of-type::before": {
              content: "",
            },
            "blockquote p:last-of-type::after": {
              content: "",
            },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
}
