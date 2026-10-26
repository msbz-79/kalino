import { IoLogInOutline } from "react-icons/io5";
import { Link } from "react-router";
import { useAuth } from "../../../context/AuthContext";

function Register() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && user) {
    return (

      <Link to={user.role === "admin" ? "/admin" : "/panel"}>
        <div className="hidden lg:flex items-center gap-2 rounded-xl border border-borderColor px-3 py-2 ml-5 text-lightTextColor dark:text-textColor shadow-lightButtonShadow dark:shadow-darkButtonShadow hover:bg-surfaceHoverColor hover:text-textColor transition-all duration-200">
          <span className="text-sm">
            {user.name}
          </span>
        </div>
      </Link>

    );
  }

  return (
    <Link to="/login">
      <div className="hidden lg:flex items-center border rounded-xl border-borderColor py-2 px-3 ml-5 shadow-lightButtonShadow dark:shadow-darkButtonShadow text-lightTextColor dark:text-textColor hover:bg-surfaceHoverColor hover:text-textColor transition-all duration-200">
        <IoLogInOutline className="size-5" />
        <span>ورود | ثبت نام</span>
      </div>
    </Link>
  );
}

export default Register;
