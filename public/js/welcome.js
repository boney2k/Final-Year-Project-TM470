document.addEventListener("DOMContentLoaded", async () => {
  // Fetch the user's name from the server
  try {
    const response = await fetch("/get_username");
    if (response.ok) {
      const data = await response.json();
      const username = data.username;
      const usernameElement = document.getElementById("username");
      if (usernameElement) {
        usernameElement.textContent = username;
      }
    } else {
      console.error("Failed to fetch username. Status:", response.status);
    }
  } catch (error) {
    console.error("Error fetching username:", error);
  }

  // Fetch the reminder and display it
  try {
    const response = await fetch("/api/getReminder");
    const data = await response.json();
    const reminderContainer = document.getElementById("reminderContainer");

    if (response.ok && data.message === 'No reminder set') {
      reminderContainer.innerHTML = "<p class='no-reminder'>No Medication reminder set.</p>";
    } else if (response.ok) {
      const reminder = data;
      const initialDate = new Date(reminder.initialDate);
      const dateString = initialDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      reminderContainer.innerHTML = `
        <p>Your medication collection date is:</p>
        <div class="collection-date">${dateString}</div>
        <button id="collectedButton">Collected</button>
        <button id="clearReminderButton">Clear Reminder</button>
      `;

      console.log("Reminder loaded:", reminder);

      document.getElementById("collectedButton").addEventListener("click", async () => {
        if (confirm("Confirm medication has been collected?")) {
          try {
            // Fetch the current reminder
            const reminderResponse = await fetch("/api/getReminder");
            const reminder = await reminderResponse.json();

            // Log the current reminder data
            console.log("Fetched reminder:", reminder);

            // Ensure the reminder data is valid
            if (!reminder || !reminder.nextCollectionDate || !reminder.frequency) {
              throw new Error("Invalid reminder data.");
            }

            // Parse the next collection date and initial date
            const nextCollectionDate = new Date(reminder.nextCollectionDate);
            console.log("Current next collection date:", nextCollectionDate);

            // Calculate the new next collection date
            const newNextCollectionDate = new Date(nextCollectionDate);
            newNextCollectionDate.setDate(newNextCollectionDate.getDate() + reminder.frequency * 7); // Add the frequency in weeks
            console.log("New next collection date:", newNextCollectionDate);

            // Update the reminder with the new date
            const updateResponse = await fetch("/api/setReminder", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                initialDate: nextCollectionDate.toISOString(), // Reset initialDate to previous nextCollectionDate
                frequency: reminder.frequency,
                nextCollectionDate: newNextCollectionDate.toISOString(), // Use ISO string format for consistency
              }),
            });

            if (updateResponse.ok) {
              console.log("Reminder updated successfully.");
              location.reload(); // Reload the page to show the updated reminder
            } else {
              console.error("Failed to update reminder. Status:", updateResponse.status);
              alert("Failed to update reminder. Please try again.");
            }
          } catch (error) {
            console.error("Error updating reminder:", error);
            alert("An error occurred. Please try again.");
          }
        }
      });

      document.getElementById("clearReminderButton").addEventListener("click", async () => {
        if (confirm("Are you sure you want to clear the reminder?")) {
          await fetch("/api/clearReminder", {
            method: "DELETE",
          });
          location.reload();
        }
      });
    } else {
      console.error("Failed to fetch reminder. Status:", response.status);
    }
  } catch (error) {
    console.error("Error fetching reminder:", error);
  }

  // Fetch and display upcoming GP and hospital visits within the next 4 weeks
  async function fetchAndDisplayUpcomingVisits() {
    try {
      const now = new Date();
      const inFourWeeks = new Date();
      inFourWeeks.setDate(now.getDate() + 28);

      const [gpResponse, hospitalResponse, dentistResponse] = await Promise.all([
        fetch("/api/get_upcoming_gp_visits"),
        fetch("/api/get_upcoming_hospital_visits"),
        fetch("/api/get_upcoming_dentist_visits")
      ]);

      if (gpResponse.ok && hospitalResponse.ok && dentistResponse.ok) {
        const gpVisits = await gpResponse.json();
        const hospitalVisits = await hospitalResponse.json();
        const dentistVisits = await dentistResponse.json();

        const gpVisitsList = document.getElementById("gpVisitsList");
        const hospitalVisitsList = document.getElementById("hospitalVisitsList");
        const dentistVisitsList = document.getElementById("dentistVisitsList");

        // Clear existing content
        gpVisitsList.innerHTML = "";
        hospitalVisitsList.innerHTML = "";
        dentistVisitsList.innerHTML = "";

        //display upcoming gp visists
        if (gpVisits.length > 0) {
          const gpList = document.createElement("ul");
          gpList.innerHTML = "<h3>Upcoming GP Visits:</h3>";
          gpVisits.forEach((visit) => {
            const visitDate = new Date(visit.date);
            if (visitDate >= now && visitDate <= inFourWeeks) {
              const listItem = document.createElement("li");
              listItem.textContent = `${visitDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
              })} at ${visit.time} - ${visit.description}`;
              gpList.appendChild(listItem);
            }
          });
          gpVisitsList.appendChild(gpList);
        } else {
          gpVisitsList.innerHTML = "<p>No upcoming GP visits.</p>";
        }

        //display upcoming hospital visits
        if (hospitalVisits.length > 0) {
          const hospitalList = document.createElement("ul");
          hospitalList.innerHTML = "<h3>Upcoming Hospital Visits:</h3>";
          hospitalVisits.forEach((visit) => {
            const visitDate = new Date(visit.date);
            if (visitDate >= now && visitDate <= inFourWeeks) {
              const listItem = document.createElement("li");
              listItem.textContent = `${visitDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
              })} at ${visit.time} - ${visit.description}`;
              hospitalList.appendChild(listItem);
            }
          });
          hospitalVisitsList.appendChild(hospitalList);
        } else {
          hospitalVisitsList.innerHTML = "<p>No upcoming hospital visits.</p>";
        }

        // Display upcoming dentist visits
        if (dentistVisits.length > 0) {
          const dentistList = document.createElement("ul");
          dentistList.innerHTML = "<h3>Upcoming Dentist Visits:</h3>";
          dentistVisits.forEach((visit) => {
            const visitDate = new Date(visit.date);
            if (visitDate >= now && visitDate <= inFourWeeks) {
              const listItem = document.createElement("li");
              listItem.textContent = `${visitDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
              })} at ${visit.time} - ${visit.description}`;
              dentistList.appendChild(listItem);
            }
          });
          dentistVisitsList.appendChild(dentistList);
        } else {
          dentistVisitsList.innerHTML = "<p>No upcoming dentist visits.</p>";
        }
      } else {
        console.error("Failed to fetch upcoming visits. Status:", gpResponse.status, hospitalResponse.status);
      }
    } catch (error) {
      console.error("Error fetching upcoming visits:", error);
    }
  }

  fetchAndDisplayUpcomingVisits();
});

function confirmLogout() {
  return confirm("Are you sure you want to log out?");
}
