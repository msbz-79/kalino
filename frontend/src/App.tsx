import { RouterProvider } from "react-router";
import router from "./routes";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontSize: "15px",
            },
          }}
        />

        <RouterProvider router={router} />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
