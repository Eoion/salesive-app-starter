import { Link, useLocation } from "react-router-dom";
import { Centered } from "../components/States.jsx";

// Client-side 404 for unknown in-app paths. Keeps ?shop= on the "back to app" link
// so the store context survives the bounce.
export default function NotFound() {
    const { search } = useLocation();
    return (
        <Centered>
            <div className="text-center">
                <p className="text-sm font-medium text-gray-900">Page not found</p>
                <Link
                    to={`/${search}`}
                    className="mt-2 inline-block text-sm font-medium text-wood-600 hover:text-wood-700"
                >
                    Back to the app
                </Link>
            </div>
        </Centered>
    );
}
