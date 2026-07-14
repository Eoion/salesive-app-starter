/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
        extend: {
            colors: {
                // Warm walnut / wood palette — the notes app's theme.
                wood: {
                    50: "#FBF5EC", // parchment
                    100: "#F1E5D2",
                    200: "#E0C9A6",
                    300: "#CBA878",
                    400: "#B08A55",
                    500: "#946C3B",
                    600: "#7A5230", // primary (white text passes AA)
                    700: "#5F4025",
                    800: "#48301C",
                    900: "#332114",
                },
            },
            fontFamily: {
                // A warmer serif for headings gives the "notebook" feel; falls
                // back to the system serif stack so no web font is required.
                serif: ["Georgia", "Cambria", "'Times New Roman'", "serif"],
            },
        },
    },
    plugins: [],
};
