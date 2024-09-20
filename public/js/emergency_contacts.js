document.addEventListener("DOMContentLoaded", () => {
    // Fetch and display existing contacts when the page loads
    fetchContacts();
  
    // Handle form submission for adding or editing contacts
    document
      .getElementById("contactForm")
      .addEventListener("submit", async (event) => {
        event.preventDefault();
  
        // Clear previous error messages
        clearErrors();
  
        const relationType = document.getElementById("contactType").value;
        const contactName = document.getElementById("contactName").value;
        const contactHomePhone = document.getElementById("contactHomePhone").value;
        const contactWorkPhone = document.getElementById("contactWorkPhone").value;
        const contactMobilePhone = document.getElementById("contactMobile").value;
        const contactEmail = document.getElementById("contactEmail").value;
  
        // Validate form data
        if (
          !validateForm(
            contactName,
            contactHomePhone,
            contactWorkPhone,
            contactMobilePhone
          )
        ) {
          return; // Stop form submission if validation fails
        }
  
        // Check if we are adding or editing a contact
        const contactId = document
          .getElementById("contactForm")
          .getAttribute("data-contact-id");
        if (contactId) {
          // Editing an existing contact
          await updateContact(
            contactId,
            relationType,
            contactName,
            contactHomePhone,
            contactWorkPhone,
            contactMobilePhone,
            contactEmail
          );
        } else {
          // Adding a new contact
          await addContact(
            relationType,
            contactName,
            contactHomePhone,
            contactWorkPhone,
            contactMobilePhone,
            contactEmail
          );
        }
  
        // Reset the form and reload contacts
        document.getElementById("contactForm").reset();
        document
          .getElementById("contactForm")
          .removeAttribute("data-contact-id");
        document.getElementById("submitContactButton").textContent =
          "Add Contact";
        fetchContacts();
      });
  });
  
  function validateForm(name, homePhone, workPhone, mobilePhone) {
    let isValid = true;
  
    // Validate Name
    if (!/^[A-Za-z\s]+$/.test(name)) {
      document.getElementById("nameError").textContent =
        "Name should only contain letters and spaces.";
      isValid = false;
    }
  
    // Validate Phone Numbers only if they are not empty
    const phonePattern = /^\d{11}$/;
    if (homePhone && !phonePattern.test(homePhone)) {
      document.getElementById("homePhoneError").textContent =
        "Home Phone must be exactly 11 digits.";
      isValid = false;
    }
    if (workPhone && !phonePattern.test(workPhone)) {
      document.getElementById("workPhoneError").textContent =
        "Work Phone must be exactly 11 digits.";
      isValid = false;
    }
    if (mobilePhone && !phonePattern.test(mobilePhone)) {
      document.getElementById("mobileError").textContent =
        "Mobile must be exactly 11 digits.";
      isValid = false;
    }
  
    return isValid;
  }
  
  
  function clearErrors() {
    document.getElementById("nameError").textContent = "";
    document.getElementById("homePhoneError").textContent = "";
    document.getElementById("workPhoneError").textContent = "";
    document.getElementById("mobileError").textContent = "";
  }
  
  // Fetch contacts from the server and display them
  async function fetchContacts() {
    const response = await fetch("/get_contacts");
    if (response.ok) {
      const contacts = await response.json();
      displayContacts(contacts);
    } else {
      console.error("Failed to fetch contacts");
    }
  }
  
  // Display contacts in the list
  function displayContacts(contacts) {
    const list = document.getElementById("contactsItems");
    list.innerHTML = "";
  
    contacts.forEach((contact) => {
      // Create list item
      const listItem = document.createElement("li");
      listItem.classList.add("contact-item");
  
      // Create elements for contact details
      const contactType = document.createElement("span");
      contactType.classList.add("contact-type");
      contactType.textContent = `${contact.relationType}:`;
  
      const contactName = document.createElement("span");
      contactName.classList.add("contact-name");
      contactName.textContent = contact.name;
  
      const contactHomePhone = document.createElement("span");
      contactHomePhone.classList.add("contact-home-phone");
      contactHomePhone.textContent = `Home: ${contact.homePhone}`;
  
      const contactWorkPhone = document.createElement("span");
      contactWorkPhone.classList.add("contact-work-phone");
      contactWorkPhone.textContent = `Work: ${contact.workPhone}`;
  
      const contactMobilePhone = document.createElement("span");
      contactMobilePhone.classList.add("contact-mobile-phone");
      contactMobilePhone.textContent = `Mobile: ${contact.mobilePhone}`;
  
      const contactEmail = document.createElement("span");
      contactEmail.classList.add("contact-email");
      contactEmail.innerHTML = `Email: <a href="mailto:${contact.email}">${contact.email}</a>`;
  
      // Create actions container
      const actionsContainer = document.createElement("div");
      actionsContainer.classList.add("contact-actions");
  
      const editButton = document.createElement("button");
      editButton.textContent = "Edit";
      editButton.onclick = () => editContact(contact._id);
      actionsContainer.appendChild(editButton);
  
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.classList.add("delete-button");
      deleteButton.onclick = () => deleteContact(contact._id);
      actionsContainer.appendChild(deleteButton);
  
      // Append all elements to the list item
      listItem.appendChild(contactType);
      listItem.appendChild(contactName);
      listItem.appendChild(contactHomePhone);
      listItem.appendChild(contactWorkPhone);
      listItem.appendChild(contactMobilePhone);
      listItem.appendChild(contactEmail);
      listItem.appendChild(actionsContainer);
  
      list.appendChild(listItem);
    });
  }
  
  // Add a new contact
  async function addContact(
    relationType,
    name,
    homePhone,
    workPhone,
    mobilePhone,
    email
  ) {
    const response = await fetch("/add_contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        relationType,
        name,
        homePhone,
        workPhone,
        mobilePhone,
        email,
      }),
    });
  
    if (!response.ok) {
      console.error("Failed to add contact");
    }
  }
  
  // Edit an existing contact
  function editContact(contactId) {
    // Fetch the contact details and populate the form for editing
    fetch(`/get_contact/${contactId}`)
      .then((response) => response.json())
      .then((contact) => {
        document.getElementById("contactType").value = contact.relationType;
        document.getElementById("contactName").value = contact.name;
        document.getElementById("contactHomePhone").value = contact.homePhone;
        document.getElementById("contactWorkPhone").value = contact.workPhone;
        document.getElementById("contactMobile").value = contact.mobilePhone;
        document.getElementById("contactEmail").value = contact.email;
  
        // Set the form to edit mode
        document
          .getElementById("contactForm")
          .setAttribute("data-contact-id", contactId);
        document.getElementById("submitContactButton").textContent =
          "Update Contact";
      });
  }
  
  // Update an existing contact
  async function updateContact(
    contactId,
    relationType,
    name,
    homePhone,
    workPhone,
    mobilePhone,
    email
  ) {
    const response = await fetch(`/edit_contact/${contactId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        relationType,
        name,
        homePhone,
        workPhone,
        mobilePhone,
        email,
      }),
    });
  
    if (!response.ok) {
      console.error("Failed to update contact");
    }
  }
  
  // Delete a contact with confirmation
  async function deleteContact(contactId) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this contact?"
    );
    if (confirmDelete) {
      const response = await fetch(`/delete_contact/${contactId}`, {
        method: "DELETE",
      });
  
      if (response.ok) {
        fetchContacts(); // Refresh the contact list
      } else {
        console.error("Failed to delete contact");
      }
    }
  }
  