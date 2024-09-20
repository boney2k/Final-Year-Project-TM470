document.addEventListener("DOMContentLoaded", () => {
    // Fetch and display existing contacts when the page loads
    fetchDoctorContacts();
  
    // Handle form submission for adding or editing contacts
    document
      .getElementById("doctorContactForm")
      .addEventListener("submit", async (event) => {
        event.preventDefault();
  
        // Clear previous error messages
        document
          .querySelectorAll(".error-message")
          .forEach((el) => (el.textContent = ""));
  
        const contactType = document.getElementById("contactType").value;
        const doctorName = document.getElementById("doctorName").value;
        const doctorAddress = document.getElementById("doctorAddress").value;
        const doctorTelephone = document.getElementById("doctorTelephone").value;
        const doctorEmail = document.getElementById("doctorEmail").value;
  
        // Validation flags
        let valid = true;
  
        // Validate name
        if (!/^[A-Za-z\s]+$/.test(doctorName)) {
          document.getElementById("nameError").textContent =
            "Name should contain only letters and spaces.";
          valid = false;
        }
  
        // Validate telephone
        if (!/^\d{11}$/.test(doctorTelephone)) {
          document.getElementById("telephoneError").textContent =
            "Telephone number must be exactly 11 digits.";
          valid = false;
        }
  
        // Validate email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doctorEmail)) {
          document.getElementById("emailError").textContent =
            "Please enter a valid email address.";
          valid = false;
        }
  
        if (!valid) {
          return; // Prevent form submission if invalid
        }
  
        // Check if we are adding or editing a contact
        const contactId = document
          .getElementById("doctorContactForm")
          .getAttribute("data-contact-id");
        if (contactId) {
          // Editing an existing contact
          await updateDoctorContact(
            contactId,
            contactType,
            doctorName,
            doctorAddress,
            doctorTelephone,
            doctorEmail
          );
        } else {
          // Adding a new contact
          await addDoctorContact(
            contactType,
            doctorName,
            doctorAddress,
            doctorTelephone,
            doctorEmail
          );
        }
  
        // Reset the form and reload contacts
        document.getElementById("doctorContactForm").reset();
        document
          .getElementById("doctorContactForm")
          .removeAttribute("data-contact-id");
        document.getElementById("submitDoctorButton").textContent =
          "Add Contact";
        fetchDoctorContacts();
      });
  });
  
  // Fetch contacts from the server and display them
  async function fetchDoctorContacts() {
    const response = await fetch("/get_doctor_contacts");
    if (response.ok) {
      const contacts = await response.json();
      displayDoctorContacts(contacts);
    } else {
      console.error("Failed to fetch contacts");
    }
  }
  
  // Display contacts in the list
  function displayDoctorContacts(contacts) {
    const list = document.getElementById("doctorContactsItems");
    list.innerHTML = "";
  
    contacts.forEach((contact) => {
      // Create list item
      const listItem = document.createElement("li");
      listItem.classList.add("contact-item");
  
      // Create elements for contact details
      const contactType = document.createElement("span");
      contactType.classList.add("contact-type");
      contactType.textContent = `${contact.contactType}:`;
  
      const contactName = document.createElement("span");
      contactName.classList.add("contact-name");
      contactName.textContent = contact.name;
  
      const contactAddress = document.createElement("span");
      contactAddress.classList.add("contact-address");
      contactAddress.textContent = `Address: ${contact.address}`;
  
      const contactTelephone = document.createElement("span");
      contactTelephone.classList.add("contact-telephone");
      contactTelephone.textContent = `Telephone: ${contact.telephone}`;
  
      const contactEmail = document.createElement("span");
      contactEmail.classList.add("contact-email");
      contactEmail.innerHTML = `Email: <a href="mailto:${contact.email}">${contact.email}</a>`;
  
      // Create buttons
      const editButton = document.createElement("button");
      editButton.classList.add("action-button", "edit-button");
      editButton.textContent = "Edit";
      editButton.onclick = () => editDoctorContact(contact._id);
  
      const deleteButton = document.createElement("button");
      deleteButton.classList.add("action-button", "delete-button");
      deleteButton.textContent = "Delete";
      deleteButton.onclick = () => deleteDoctorContact(contact._id);
  
      // Append elements to list item
      listItem.appendChild(contactType);
      listItem.appendChild(contactName);
      listItem.appendChild(contactAddress);
      listItem.appendChild(contactTelephone);
      listItem.appendChild(contactEmail);
      listItem.appendChild(editButton);
      listItem.appendChild(deleteButton);
  
      // Append list item to list
      list.appendChild(listItem);
    });
  }
  
  // Add a new contact
  async function addDoctorContact(type, name, address, telephone, email) {
    const response = await fetch("/add_doctor_contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contactType: type,
        name,
        address,
        telephone,
        email,
      }),
    });
  
    if (!response.ok) {
      console.error("Failed to add contact");
    }
  }
  
  // Edit an existing contact
  function editDoctorContact(contactId) {
    fetch(`/get_doctor_contact/${contactId}`)
      .then((response) => response.json())
      .then((contact) => {
        document.getElementById("contactType").value = contact.contactType;
        document.getElementById("doctorName").value = contact.name;
        document.getElementById("doctorAddress").value = contact.address;
        document.getElementById("doctorTelephone").value =
          contact.telephone;
        document.getElementById("doctorEmail").value = contact.email;
  
        // Set the form to edit mode
        document
          .getElementById("doctorContactForm")
          .setAttribute("data-contact-id", contactId);
        document.getElementById("submitDoctorButton").textContent =
          "Update Contact";
      });
  }
  
  // Update an existing contact
  async function updateDoctorContact(
    contactId,
    type,
    name,
    address,
    telephone,
    email
  ) {
    const response = await fetch(`/update_doctor_contact/${contactId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contactType: type,
        name,
        address,
        telephone,
        email,
      }),
    });
  
    if (!response.ok) {
      console.error("Failed to update contact");
    }
  }
  
  // Delete a doctor/consultant contact with confirmation
  async function deleteDoctorContact(contactId) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this contact?"
    );
    if (confirmDelete) {
      try {
        const response = await fetch(
          `/delete_doctor_contact/${contactId}`,
          {
            method: "DELETE",
          }
        );
  
        if (!response.ok) {
          console.error("Failed to delete contact");
        } else {
          fetchDoctorContacts(); // Refresh the contact list
        }
      } catch (error) {
        console.error("Error deleting contact:", error);
      }
    }
  }
  