document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM content loaded. Fetching user details...");
    const response = await fetch("/get_user_details");
    console.log("Response received:", response);
    const user = await response.json();
    console.log("User details:", user);
    displayUserDetails(user);
  });

  function displayUserDetails(user) {
    console.log("Displaying user details:", user);
    const userDetailsContainer = document.getElementById(
      "userDetailsContainer"
    );
    userDetailsContainer.innerHTML = `
      <p>Username: ${user.username}</p>
      <p>Email: ${user.email}</p>
      <p>Address: ${user.address}</p>
      <p>Phone: ${user.phone}</p>
    `;
  }

  function showEditForm(user) {
    document.getElementById("userDetailsContainer").style.display = "none";
    document.getElementById("editFormContainer").style.display = "block";

    document.getElementById("username").value = user.username;
    document.getElementById("email").value = user.email;
    document.getElementById("address").value = user.address || "";
    document.getElementById("phone").value = user.phone || "";
  }

  document
    .getElementById("editButton")
    .addEventListener("click", async () => {
      const response = await fetch("/get_user_details");
      const user = await response.json();
      showEditForm(user);
    });

  document
    .getElementById("userDetailsForm")
    .addEventListener("submit", async (event) => {
      event.preventDefault();

      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      const address = document.getElementById("address").value;
      const phone = document.getElementById("phone").value;

      const response = await fetch("/update_user_details", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          address,
          phone,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("User details updated successfully!");
        displayUserDetails(result);
        document.getElementById("editFormContainer").style.display = "none";
        document.getElementById("userDetailsContainer").style.display =
          "block";
      } else {
        const errorContainer = document.getElementById("errorContainer");
        errorContainer.textContent =
          result.error || "Failed to update user details.";
      }
    });

  document
    .getElementById("cancelEditButton")
    .addEventListener("click", () => {
      document.getElementById("editFormContainer").style.display = "none";
      document.getElementById("userDetailsContainer").style.display =
        "block";
    });