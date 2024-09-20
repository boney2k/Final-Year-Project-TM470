document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Fetch medication data from the server when the page loads
    const response = await fetch("/get_medications");
    
    if (!response.ok) {
      throw new Error("Failed to fetch medications.");
    }

    const medications = await response.json();
    medications.forEach((medication) => {
      displayMedication(medication);
    });

    // Check for a message in localStorage
    const reminderMessage = localStorage.getItem("reminderMessage");
    if (reminderMessage) {
      displayMessage(reminderMessage, "success"); // Show the message with a 'success' style
      localStorage.removeItem("reminderMessage"); // Remove the message after displaying it
    }
  } catch (error) {
    console.error("Error loading medications:", error);
    displayMessage("Error loading medications. Please try again later.", "error");
  }
});

document.getElementById("medicationForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const medicationName = document.getElementById("medicationName").value;
  const dosageAmount = parseFloat(document.getElementById("dosageAmount").value);
  const dosageUnit = document.getElementById("dosageUnit").value;
  const frequency = document.getElementById("frequency").value;

  // Validate dosageAmount
  if (isNaN(dosageAmount) || dosageAmount < 0) {
    alert("Dosage amount must be a non-negative number");
    return;
  }

  try {
    const response = await fetch("/submit_medication", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        medicationName,
        dosage: `${dosageAmount} ${dosageUnit}`,
        frequency,
      }),
    });

    if (response.ok) {
      const medication = await response.json();
      document.getElementById("medicationForm").reset();
      displayMedication(medication); // Call the function to display medication
      displayMessage("Medication added successfully!", "success"); // Show success message
    } else {
      displayMessage("Failed to add medication. Please try again.", "error");
    }
  } catch (error) {
    console.error("Error adding medication:", error);
    displayMessage("An error occurred. Please try again later.", "error");
  }
});

// Function to display medication
function displayMedication(medication) {
  const medicationList = document.getElementById("medicationItems");
  const listItem = document.createElement("li");
  listItem.textContent = `${medication.medicationName} - Dosage: ${medication.dosage}, Frequency: ${medication.frequency}`;
  medicationList.appendChild(listItem);

  // Create a delete button
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", async () => {
    const confirmDelete = confirm("Are you sure you want to delete this entry?");
    if (confirmDelete) {
      try {
        const response = await fetch(`/delete_medication/${medication._id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          listItem.remove(); // Remove the item from the UI
        } else {
          console.error("Failed to delete medication");
        }
      } catch (error) {
        console.error("Error deleting medication:", error);
      }
    }
  });

  listItem.appendChild(deleteButton);
  medicationList.appendChild(listItem);
}

// Function to display messages
function displayMessage(message, type) {
  const messageContainer = document.getElementById("messageContainer");
  messageContainer.textContent = message;
  messageContainer.className = `${type} message-show`; // Apply style and show class
  messageContainer.classList.remove("hidden");

  // Optionally hide the message after a few seconds
  setTimeout(() => {
    messageContainer.classList.add("hidden");
  }, 5000);
}
