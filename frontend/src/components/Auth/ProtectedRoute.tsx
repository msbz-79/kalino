import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";

type ProtectedRouteProps = {
    allowedRole: "user" | "admin";
};

function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div>در حال بررسی وضعیت ورود...</div>;
    }

    if (!isAuthenticated || !user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    if (user.role !== allowedRole) {
        const correctPath =
            user.role === "admin" ? "/admin" : "/panel";

        return <Navigate to={correctPath} replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;
