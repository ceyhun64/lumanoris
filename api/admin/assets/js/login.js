document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#login-form");
  const csrfToken = document.querySelector('input[name="csrf_token"]').value;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    formData.append("csrf_token", csrfToken);

    try {
      const response = await fetch("/ajax/giris.php", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });

      const data = await response.json();

      new Notification({
        text: data.message,
        position: "top-right",
        type: data.status == "success" ? "success" : "error",
        pauseOnHover: false,
        canClose: false,
        autoClose: 3000,
        showProgress: true,
      });

      if (data.status === "success" && data.redirect) {
        setTimeout(() => {
          window.location.href = data.redirect;
        }, 3000);
      }
    } catch (error) {
      new Notification({
        text: "Bir hata oluştu: " + error.message,
        position: "top-right",
        type: "error",
        pauseOnHover: false,
        canClose: false,
        autoClose: 3000,
        showProgress: true,
      });
    }
  });
});