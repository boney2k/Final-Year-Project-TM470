document.addEventListener("DOMContentLoaded", () => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Function to format date as DD-MM-YYYY
  function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Function to handle form submission and display entries
  async function handleFormSubmission(
    formId,
    listId,
    apiEndpoint,
    dateFieldId,
    timeFieldId,
    descriptionFieldId,
    entryType
  ) {
    document
      .getElementById(formId)
      .addEventListener("submit", async (event) => {
        event.preventDefault();

        const date = document.getElementById(dateFieldId).value;
        const time = document.getElementById(timeFieldId).value;
        const description = document.getElementById(descriptionFieldId).value;

        try {
          const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              date,
              time,
              description,
            }),
          });

          if (response.ok) {
            const entry = await response.json();
            console.log(`${formId} entry added successfully:`, entry);
            document.getElementById(formId).reset();
            displayEntry(entry, listId, entryType);
          } else {
            console.error(`Failed to add ${formId} entry`);
          }
        } catch (error) {
          console.error(`Error adding ${formId} entry:`, error);
        }
      });
  }

  // Function to display entry with a delete button
  function displayEntry(entry, listId, entryType) {
    const list = document.getElementById(listId);
    if (!list) {
      console.error(`Element with ID ${listId} not found`);
      return;
    }
    const listItem = document.createElement("li");
    const formattedDate = formatDate(entry.date);

    // Create delete button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("delete");
    deleteButton.addEventListener("click", async () => {
      const confirmed = confirm("Are you sure you want to delete this entry?");
      if (confirmed) {
        try {
          const response = await fetch(`/delete_entry/${entryType}/${entry._id}`, {
            method: "DELETE",
          });
          if (response.ok) {
            list.removeChild(listItem);
            console.log("Entry deleted successfully");
          } else {
            console.error("Failed to delete entry");
          }
        } catch (error) {
          console.error("Error deleting entry:", error);
        }
      }
    });

    // Append date, time, description, and delete button to the list item
    listItem.innerHTML = `${formattedDate} ${entry.time} - ${entry.description} `;
    listItem.appendChild(deleteButton);

    // Append the list item to the list
    list.appendChild(listItem);
  }

  // Function to fetch and display existing entries
  async function fetchEntries(apiEndpoint, listId, entryType) {
    try {
      const response = await fetch(apiEndpoint);
      console.log("Fetch response:", await response.clone().json()); // Log response data
      if (response.ok) {
        const entries = await response.json();
        entries.forEach((entry) => displayEntry(entry, listId, entryType));
      } else {
        console.error(`Failed to fetch entries from ${apiEndpoint}`);
      }
    } catch (error) {
      console.error(`Error fetching entries from ${apiEndpoint}:`, error);
    }
  }

  // Set max attribute for Falls and Medical Issues to today's date
  ["fallsDate", "medicalIssuesDate"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.setAttribute("max", today);
    }
  });

  // Don't set max attribute for GP Visits, Hospital Visits, and Dentist Visits
  ["gpVisitsDate", "hospitalVisitsDate", "dentistVisitsDate"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.removeAttribute("max");
    }
  });

  // Check for specific page ID to initialize form handling and fetching entries
  const pageId = document.body.id;
  console.log("Page ID:", pageId);

  if (pageId === "falls") {
    handleFormSubmission(
      "fallsForm",
      "fallsItems",
      "/submit_fall",
      "fallsDate",
      "fallsTime",
      "fallsDescription",
      "fall"
    );
    fetchEntries("/get_falls", "fallsItems", "fall");
  } else if (pageId === "medical-issues") {
    handleFormSubmission(
      "medicalIssuesForm",
      "medicalIssuesItems",
      "/submit_medical_issue",
      "medicalIssuesDate",
      "medicalIssuesTime",
      "medicalIssuesDescription",
      "medical_issue"
    );
    fetchEntries("/get_medical_issues", "medicalIssuesItems", "medical_issue");
  } else if (pageId === "gp-visits") {
    handleFormSubmission(
      "gpVisitsForm",
      "gpVisitsItems",
      "/submit_gp_visit",
      "gpVisitsDate",
      "gpVisitsTime",
      "gpVisitsDescription",
      "gp_visit"
    );
    fetchEntries("/get_gp_visits", "gpVisitsItems", "gp_visit");
  } else if (pageId === "hospital-visits") {
    handleFormSubmission(
      "hospitalVisitsForm",
      "hospitalVisitsItems",
      "/submit_hospital_visit",
      "hospitalVisitsDate",
      "hospitalVisitsTime",
      "hospitalVisitsDescription",
      "hospital_visit"
    );
    fetchEntries("/get_hospital_visits", "hospitalVisitsItems", "hospital_visit");
  } else if (pageId === "dentist-visits") {
    // Add dentist visit handling
    handleFormSubmission(
      "dentistVisitsForm",
      "dentistVisitsItems",
      "/submit_dentist_visit",
      "dentistVisitsDate",
      "dentistVisitsTime",
      "dentistVisitsDescription",
      "dentist_visit"
    );
    fetchEntries("/get_dentist_visits", "dentistVisitsItems", "dentist_visit");
  }

  // Handle the "Back to Diary" button functionality
  const backToDiaryButton = document.getElementById("backToDiary");
  if (backToDiaryButton) {
    backToDiaryButton.addEventListener("click", () => {
      window.location.href = "/my_diary"; // Adjust the path as needed
    });
  }
});
