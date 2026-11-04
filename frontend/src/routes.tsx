import { createBrowserRouter } from "react-router";
import HomeLayout from "./components/Layout/HomeLayout";
import Landing from "./pages/Landing/Page";
import Mobile from "./pages/Mobile/Mobile";
import Laptop from "./pages/Laptop/Laptop";
import Login from "./pages/Login/Page";
import Register from "./pages/register/Page";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import Orders from "./pages/Orders/Page";
import OrderDetails from "./pages/OrderDetails/Page";
import Locations from "./pages/Addresses/Page";
import Comments from "./pages/Comments/Page";
import Tickets from "./pages/Tickets/Page";
import PanelLayout from "./components/Layout/PanelLayout";
import Panel from "./pages/Panel/UserPanel/Page";
import AdminLayout from "./components/Layout/AdminLayout";
import Admin from "./pages/Panel/AdminPanel/Page";
import Users from "./pages/Users/Page";
import Products from "./pages/Products/Page";
import UserOrders from "./pages/UserOrders/Page";
import Financial from "./pages/Financial/Page";
import UserComments from "./pages/UserComments/Page";
import UserTickets from "./pages/UserTickets/Page";
import ProductDetails from "./pages/ProductDetails/Page";
import CartPage from "./pages/Cart/Page";
import CheckoutPage from "./pages/Checkout/CheckoutPage";
import ReviewOrderPage from "./pages/ReviewOrder/Page";
import PaymentResultPage from "./pages/PaymentResult/Page";
import AccountInformation from "./pages/UserInformation/Page";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeLayout />,
    children: [
      { index: true, element: <Landing /> },
      { path: "/mobile", element: <Mobile /> },
      { path: "/laptop", element: <Laptop /> },
      { path: "/products/:id/:slug", element: <ProductDetails /> },
      { path: "/cart", element: <CartPage /> },
      { path: "/checkout", element: <CheckoutPage /> },
      { path: "/review-order", element: <ReviewOrderPage /> },
      { path: "/payment-result", element: <PaymentResultPage /> },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    element: <ProtectedRoute allowedRole="user" />,
    children: [
      {
        path: "/panel",
        element: <PanelLayout />,
        children: [
          { index: true, element: <Panel /> },
          { path: "orders", element: <Orders /> },
          { path: "orders/:orderNumber", element: <OrderDetails /> },
          { path: "locations", element: <Locations /> },
          { path: "comments", element: <Comments /> },
          { path: "tickets", element: <Tickets /> },
          { path: "information", element: <AccountInformation /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRole="admin" />,
    children: [
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <Admin /> },
          { path: "users", element: <Users /> },
          { path: "products", element: <Products /> },
          { path: "userorders", element: <UserOrders /> },
          { path: "financial", element: <Financial /> },
          { path: "usercomments", element: <UserComments /> },
          { path: "usertickets", element: <UserTickets /> },
          { path: "information", element: <AccountInformation /> },

        ],
      },
    ],
  },
]);

export default router;
