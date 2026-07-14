import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
    // Absolute, because Tailwind resolves content globs against the working directory
    // (the repo root, where npm runs), not against this file. Relative globs would
    // match nothing and emit a stylesheet with no utilities in it.
    content: [
        path.join(__dirname, "index.html"),
        path.join(__dirname, "src/**/*.{js,jsx}"),
    ],
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
