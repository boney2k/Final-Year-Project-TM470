// public/js/navbar_loader.js

async function loadNavbar() {
    try {
      const response = await fetch("/partial/nav.html");
      const navHtml = await response.text();
      document.getElementById("navbar-container").innerHTML = navHtml;
    } catch (error) {
      console.error("Error loading the navigation bar:", error);
    }
  }
  
  document.addEventListener("DOMContentLoaded", loadNavbar);

  function confirmLogout() {
    return confirm("Are you sure you want to log out?");
  }
  