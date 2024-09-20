document
.getElementById("registrationForm")
.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document
    .getElementById("confirmPassword")
    .value.trim();
  const address = document.getElementById("address").value.trim();
  const phone = document.getElementById("phone").value.trim();

  // Validate password match
  if (password !== confirmPassword) {
    document.getElementById("errorContainer").textContent =
      "Passwords do not match.";
    return;
  }

  // Send registration data to the server
  const response = await fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      email,
      password,
      confirmPassword,
      address,
      phone,
    }),
  });

  const result = await response.text();

  if (response.ok) {
    window.location.href = "/login?registered=true";
  } else {
    // Display validation errors
    document.getElementById("errorContainer").textContent = result;
  }
});