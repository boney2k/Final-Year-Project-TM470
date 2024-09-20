document.addEventListener("DOMContentLoaded", () => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Set max attribute for initialDate input to today's date
  const initialDateInput = document.getElementById("initialDate");
  if (initialDateInput) {
    initialDateInput.setAttribute("min", today);
  }

  document.getElementById("reminderForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    // Get form values
    const initialDate = new Date(document.getElementById("initialDate").value);
    const frequency = parseInt(document.getElementById("frequency").value);

    if (!initialDate || isNaN(frequency)) {
      alert("Please fill in all fields correctly.");
      return;
    }

    try {
      // Send data to the server
      const response = await fetch("/api/setReminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initialDate: initialDate.toISOString(), frequency }), // Convert to ISO string
      });

      if (response.ok) {
        // Save the message to localStorage
        localStorage.setItem("reminderMessage", "Reminder saved successfully! You can view it on the Welcome page.");
        
        // Redirect back to the medication page
        window.location.href = "/medication_entry";
      } else {
        alert("Failed to save reminder. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  });
});
