"use client";

const CheckoutButton = () => {
  const handleCheckout = () => {
    // Implement checkout logic here
    alert("Redirecting to checkout...");
  };

  return (
    <button
      onClick={handleCheckout}
      className="w-full bg-green-500 text-white py-2 rounded-lg mt-4 hover:bg-green-600 transition-colors"
    >
      Buy Now
    </button>
  );
};

export default CheckoutButton;