import PocketBase from "pocketbase";

// Assuming PocketBase is running on its default port. Adjust if needed.
const pb = new PocketBase(import.meta.env.VITE_PB_URL);

// Prevent React StrictMode from killing live requests
pb.autoCancellation(false);

// Auth Persistence
pb.authStore.loadFromCookie(document.cookie);
pb.authStore.onChange(() => {
  document.cookie = pb.authStore.exportToCookie({ httpOnly: false });
});

// Refined Error Interceptor
pb.afterSend = function (response, data) {
  if (response.status === 401) {
    // Token is expired or invalid
    pb.authStore.clear();
    window.location.reload();
  }

  if (response.status >= 400) {
    console.warn(`[PB Error ${response.status}]:`, data?.message);
  }
  return data;
};

export default pb;
