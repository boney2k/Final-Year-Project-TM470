function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }
  
  function addMessage(text, className) {
    const messageElement = document.createElement("p");
    messageElement.className = `message ${className}`;
    messageElement.textContent = text;
    messageContainer.appendChild(messageElement);
  
    // Focus the container to ensure screen readers announce it
    messageContainer.focus();
  }
  
  // Check if a message should be displayed
  function displayMessage() {
    const registered = getQueryParam("registered");
    const error = getQueryParam("error");
    const logout = getQueryParam("logout");
  
    if (logout === "true") {
      addMessage("User logged out successfully.", "success");
      // Remove the `logout` query parameter to prevent the message from being shown again on refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  
    if (registered === "true") {
      addMessage("User registered successfully. Please login to continue.", "success");
    }
  
    if (error === "userNotFound") {
      addMessage("User not found. Please check your email and try again.", "error");
    }
  
    if (error === "invalidCredentials") {
      addMessage("Invalid credentials. Please try again.", "error");
    }
  }
  
  // Get the message container element
  const messageContainer = document.getElementById("messageContainer");
  
  // Add an event listener to handle page load
  document.addEventListener("DOMContentLoaded", () => {
    displayMessage();
  });
  