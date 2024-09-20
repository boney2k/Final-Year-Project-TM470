
// Core Node.js modules
const path = require('path'); // For handling file paths
const fs = require('fs'); // For file system operations (if used)

// External dependencies
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const session = require('express-session');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// Model imports
const Medication = require('models/medicationModel');
const Fall = require('models/Fall');
const MedicalIssue = require('models/MedicalIssue');
const GPVisit = require('models/GPVisit');
const HospitalVisit = require('models/HospitalVisit');
const Contact = require('models/Contact');
const DoctorContact = require('models/DoctorContact');
const Reminder = require('models/Reminder');
const DentistVisit = require('models/DentistVisit');

const app = express();

// Middleware
app.use(helmet()); // Adds various security headers
app.use(bodyParser.json()); // Parse incoming request bodies with JSON payloads
app.use(express.static(path.join(__dirname, 'views'))); // Serve static files from the 'views' directory
app.use(bodyParser.urlencoded({ extended: true })); // Parse incoming request bodies with URL-encoded payloads
app.use(mongoSanitize()); // Sanitizes user input to prevent NoSQL injection
app.use(xss()); // Sanitizes user input to prevent XSS
app.use(session({
    secret: 'secret_key', // Change this to a secure secret in production
    resave: false,
    saveUninitialized: false
}));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/carerapp', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    address: String,
    phone: String
}, { collection: 'users' })); // Specify the collection name as 'users'

app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "script-src 'self' 'unsafe-inline';"
    );
    next();
});

// Serve static files from the 'public' and 'partial' directory
app.use(express.static(path.join(__dirname, 'public'))); //css 
app.use('/partial', express.static(path.join(__dirname, 'partial'))); //nav bar


// Routes

// Helper function to validate user registration data
function validateRegistrationData(data) {
  const { username, email, password, confirmPassword, address, phone } = data;

  // Validate username: should not be empty
  if (!username || username.trim().length === 0) {
    return 'Username is required';
  }

  // Validate email: use a regex pattern for a more precise validation
  if (email && !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) {
    return 'Please enter a valid email address';
  }

  // Validate password: should be at least 6 characters long
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters long';
  }

  // Validate confirm password
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }

  // Validate address: should not be empty
  if (!address || address.trim().length === 0) {
    return 'Address is required';
  }

  // Validate phone: exactly 11 digits
  if (phone && !/^\d{11}$/.test(phone)) {
    return 'Phone number must be exactly 11 digits';
  }

  return null; // No validation errors
}

// Register Route
app.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword, address, phone } = req.body;

  // Validate input data
  const validationError = validateRegistrationData({ username, email, password, confirmPassword, address, phone });
  if (validationError) {
      console.log("Registration failed:", validationError);
      return res.status(400).send(validationError);
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    console.log("Passwords do not match");
    return res.status(400).send('Passwords do not match');
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user data into MongoDB
  try {
      await User.create({
          username,
          email,
          password: hashedPassword,
          address,
          phone
      });
      res.redirect('/login?registered=true');
  } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).send("Error registering user");
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.log("Login request received:", email, password);

  // Check if fields are empty
  if (!email || !password) {
      console.log("Login failed: Email and password are required");
      return res.redirect('/login?error=invalidCredentials'); // Redirect with error query parameter
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
      console.log("Login failed: Invalid email format");
      return res.redirect('/login?error=invalidCredentials'); // Redirect with error query parameter
  }

  // Find user by email
  const user = await User.findOne({ email });

  console.log("User found in database:", user);

  if (!user) {
      console.log("User not found");
      return res.redirect('/login?error=userNotFound'); // Redirect with error query parameter
  }

  // Compare hashed passwords
  if (await bcrypt.compare(password, user.password)) {
      // Passwords match, authentication successful
      req.session.userId = user._id; // Store user ID in session
      console.log("User authenticated successfully");
      res.redirect('/welcome'); // Redirect to welcome screen
  } else {
      // Passwords don't match
      console.log("Invalid password");
      res.redirect('/login?error=invalidCredentials'); // Redirect with error query parameter
  }
});

// Endpoint to get the username for welcome page
app.get('/get_username', async (req, res) => {
  if (!req.session.userId) {
    // If no user is logged in, send a 401 Unauthorized status
    return res.status(401).send('Unauthorized');
  }

  try {
    // Find the user by ID stored in session
    const user = await User.findById(req.session.userId);
    if (!user) {
      // If user not found, send a 404 Not Found status
      return res.status(404).send('User not found');
    }

    // Send the user's name as a response
    res.json({ username: user.username });
  } catch (error) {
    console.error("Error fetching username:", error);
    res.status(500).send('Server error');
  }
});

// Middleware for ensuring user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  console.log("User not authenticated. Redirecting to login.");
  res.redirect('/login');
}

// Helper function to validate contact data
function validateContactData(data) {
  const errors = [];

  // Validate Name
  if (!/^[A-Za-z\s]+$/.test(data.name)) {
    errors.push("Name should only contain letters and spaces.");
  }

  // Validate Phone Numbers
  const phonePattern = /^\d{11}$/;
  if (data.homePhone && !phonePattern.test(data.homePhone)) {
    errors.push("Home Phone must be exactly 11 digits.");
  }
  if (data.workPhone && !phonePattern.test(data.workPhone)) {
    errors.push("Work Phone must be exactly 11 digits.");
  }
  if (data.mobilePhone && !phonePattern.test(data.mobilePhone)) {
    errors.push("Mobile must be exactly 11 digits.");
  }

  return errors.length > 0 ? errors.join(", ") : null;
}

// Get User Details Route
app.get('/get_user_details', async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId, { _id: 0, password: 0, __v: 0 });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Send the user details as JSON response
        return res.status(200).json(user);
    } catch (error) {
        console.error("Error retrieving user details:", error);
        return res.status(500).json({ error: "Error retrieving user details" });
    }
});

// Update User Details Route
app.put('/update_user_details', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { username, email, address, phone } = req.body;

    // Validate user details
    const validationError = validateContactData({ name: username, email, telephone: phone });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Update user details
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, email, address, phone },
      { new: true, fields: { _id: 0, password: 0, __v: 0 } }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Send the updated user details as JSON response
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user details:", error);
    return res.status(500).json({ error: "Error updating user details" });
  }
});


// Handle Medication Submission Route
app.post('/submit_medication', ensureAuthenticated, async (req, res) => {
  try {
      const { medicationName, dosage, frequency } = req.body; // Extract medication data from request body
      const userId = req.session.userId; // Get the user ID from the session

      // Basic input validation
      if (!medicationName || !dosage || !frequency) {
          return res.status(400).send("All fields are required");
      }

      // Validate dosage: should be a non-negative number
      const dosageNumber = parseFloat(dosage);
      if (isNaN(dosageNumber) || dosageNumber < 0) {
          return res.status(400).send("Dosage must be a non-negative number");
      }

      // Create and save the medication
      const medication = new Medication({
          medicationName,
          dosage,
          frequency,
          userId // Include the user ID in the medication document
      });
      await medication.save(); // Save the new medication to the database
      res.status(201).json(medication); // Respond with the saved medication
  } catch (error) {
      console.error("Error adding medication:", error);
      res.status(500).send("Error adding medication");
  }
});

// Define a route to handle GET requests for fetching medications
app.get('/get_medications', ensureAuthenticated, async (req, res) => {
  try {
      // Get the user ID from the session
      const userId = req.session.userId;

      // Fetch medications associated with the user ID
      const medications = await Medication.find({ userId });

      // Send the medications as JSON response
      res.json(medications);
  } catch (error) {
      // Handle errors
      console.error("Error fetching medications:", error);
      res.status(500).send("Error fetching medications");
  }
});

// Handle Medication Deletion Route
app.delete('/delete_medication/:id', ensureAuthenticated, async (req, res) => {
  try {
      const { id } = req.params;
      const result = await Medication.findByIdAndDelete(id);
      if (!result) {
          return res.status(404).send("Medication not found");
      }
      res.status(200).send("Medication deleted successfully");
  } catch (error) {
      console.error("Error deleting medication:", error);
      res.status(500).send("Error deleting medication");
  }
});

// Define the schemas
const DiaryEntrySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  time: { type: String, required: true },
  description: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

// Handle Diary Entry Submission Routes
app.post('/submit_fall', ensureAuthenticated, async (req, res) => {
  try {
    const { date, time, description } = req.body;
    const userId = req.session.userId;
    const fallEntry = new Fall({ date, time, description, userId });
    await fallEntry.save();
    res.status(201).json(fallEntry);
  } catch (error) {
    console.error("Error adding fall entry:", error);
    res.status(500).send("Error adding fall entry");
  }
});

app.post('/submit_medical_issue', ensureAuthenticated, async (req, res) => {
  try {
    const { date, time, description } = req.body;
    const userId = req.session.userId;
    const medicalIssueEntry = new MedicalIssue({ date, time, description, userId });
    await medicalIssueEntry.save();
    res.status(201).json(medicalIssueEntry);
  } catch (error) {
    console.error("Error adding medical issue entry:", error);
    res.status(500).send("Error adding medical issue entry");
  }
});

app.post('/submit_gp_visit', ensureAuthenticated, async (req, res) => {
  try {
    const { date, time, description } = req.body;
    const userId = req.session.userId;
    const gpVisitEntry = new GPVisit({ date, time, description, userId });
    await gpVisitEntry.save();
    res.status(201).json(gpVisitEntry);
  } catch (error) {
    console.error("Error adding GP visit entry:", error);
    res.status(500).send("Error adding GP visit entry");
  }
});

app.post('/submit_hospital_visit', ensureAuthenticated, async (req, res) => {
  try {
    const { date, time, description } = req.body;
    const userId = req.session.userId;
    const hospitalVisitEntry = new HospitalVisit({ date, time, description, userId });
    await hospitalVisitEntry.save();
    res.status(201).json(hospitalVisitEntry);
  } catch (error) {
    console.error("Error adding hospital visit entry:", error);
    res.status(500).send("Error adding hospital visit entry");
  }
});

app.post('/submit_dentist_visit', ensureAuthenticated, async (req, res) => {
  try {
    const { date, time, description } = req.body;
    const userId = req.session.userId;
    const dentistVisitEntry = new DentistVisit({ date, time, description, userId });
    await dentistVisitEntry.save();
    res.status(201).json(dentistVisitEntry);
  } catch (error) {
    console.error("Error adding dentist visit entry:", error);
    res.status(500).send("Error adding dentist visit entry");
  }
});


// Define routes to fetch diary entries
app.get('/get_falls', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const falls = await Fall.find({ userId });
    res.json(falls);
  } catch (error) {
    console.error("Error fetching falls:", error);
    res.status(500).send("Error fetching falls");
  }
});

app.get('/get_medical_issues', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const medicalIssues = await MedicalIssue.find({ userId });
    res.json(medicalIssues);
  } catch (error) {
    console.error("Error fetching medical issues:", error);
    res.status(500).send("Error fetching medical issues");
  }
});

app.get('/get_gp_visits', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const gpVisits = await GPVisit.find({ userId });
    res.json(gpVisits);
  } catch (error) {
    console.error("Error fetching GP visits:", error);
    res.status(500).send("Error fetching GP visits");
  }
});

app.get('/get_hospital_visits', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const hospitalVisits = await HospitalVisit.find({ userId });
    res.json(hospitalVisits);
  } catch (error) {
    console.error("Error fetching hospital visits:", error);
    res.status(500).send("Error fetching hospital visits");
  }
});

app.get('/get_dentist_visits', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const dentistVisits = await DentistVisit.find({ userId });
    res.json(dentistVisits);
  } catch (error) {
    console.error("Error fetching dentist visits:", error);
    res.status(500).send("Error fetching dentist visits");
  }
});


// Define routes to delete diary entries
app.delete('/delete_entry/fall/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await Fall.findByIdAndDelete(id);
    res.status(200).send("Fall entry deleted");
  } catch (error) {
    console.error("Error deleting fall entry:", error);
    res.status(500).send("Error deleting fall entry");
  }
});

app.delete('/delete_entry/medical_issue/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await MedicalIssue.findByIdAndDelete(id);
    res.status(200).send("Medical issue entry deleted");
  } catch (error) {
    console.error("Error deleting medical issue entry:", error);
    res.status(500).send("Error deleting medical issue entry");
  }
});

app.delete('/delete_entry/gp_visit/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await GPVisit.findByIdAndDelete(id);
    res.status(200).send("GP visit entry deleted");
  } catch (error) {
    console.error("Error deleting GP visit entry:", error);
    res.status(500).send("Error deleting GP visit entry");
  }
});

app.delete('/delete_entry/hospital_visit/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await HospitalVisit.findByIdAndDelete(id);
    res.status(200).send("Hospital visit entry deleted");
  } catch (error) {
    console.error("Error deleting hospital visit entry:", error);
    res.status(500).send("Error deleting hospital visit entry");
  }
});

app.delete('/delete_entry/dentist_visit/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await DentistVisit.findByIdAndDelete(id);
    res.status(200).send("Dentist visit entry deleted");
  } catch (error) {
    console.error("Error deleting dentist visit entry:", error);
    res.status(500).send("Error deleting dentist visit entry");
  }
});


// Add a new contact
app.post('/add_contact', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId; // Get user ID from the session
    const validationError = validateContactData(req.body);
    if (validationError) {
      return res.status(400).send(validationError);
    }

    const newContact = new Contact({
      userId,
      name: req.body.name,
      homePhone: req.body.homePhone,
      workPhone: req.body.workPhone,
      mobilePhone: req.body.mobilePhone,
      relationType: req.body.relationType,
      email: req.body.email,
    });
    await newContact.save();
    res.status(201).json(newContact);
  } catch (error) {
    console.error('Error adding contact:', error);
    res.status(500).send('Failed to add contact');
  }
});

// Fetch all contacts
app.get('/get_contacts', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId; // Get user ID from the session
    const contacts = await Contact.find({ userId });
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).send('Failed to fetch contacts');
  }
});

// Fetch a single contact
app.get('/get_contact/:id', ensureAuthenticated, async (req, res) => {
  try {
    const contactId = req.params.id;
    const userId = req.session.userId; // Get user ID from the session

    const contact = await Contact.findOne({ _id: contactId, userId });
    if (!contact) {
      return res.status(404).send('Contact not found');
    }

    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).send('Failed to fetch contact');
  }
});

// Edit an existing contact
app.put('/edit_contact/:id', ensureAuthenticated, async (req, res) => {
  try {
    const contactId = req.params.id;
    const updatedData = req.body;
    const userId = req.session.userId; // Get user ID from the session

    const validationError = validateContactData(updatedData);
    if (validationError) {
      return res.status(400).send(validationError);
    }

    const updatedContact = await Contact.findOneAndUpdate(
      { _id: contactId, userId },
      updatedData,
      { new: true }
    );

    if (!updatedContact) {
      return res.status(404).send('Contact not found');
    }

    res.json(updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).send('Failed to update contact');
  }
});

// Delete a contact
app.delete('/delete_contact/:id', ensureAuthenticated, async (req, res) => {
  try {
    const contactId = req.params.id;
    const userId = req.session.userId; // Get user ID from the session

    const deletedContact = await Contact.findOneAndDelete({ _id: contactId, userId });
    if (!deletedContact) {
      return res.status(404).send('Contact not found');
    }

    res.json(deletedContact);
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).send('Failed to delete contact');
  }
});



// Add a new doctor's or consultant's contact
app.post('/add_doctor_contact', ensureAuthenticated, async (req, res) => {
  try {
    const validationError = validateContactData(req.body);
    if (validationError) {
      return res.status(400).send(validationError);
    }

    const newContact = new DoctorContact({
      userId: req.session.userId,
      contactType: req.body.contactType,
      name: req.body.name,
      address: req.body.address,
      telephone: req.body.telephone,
      email: req.body.email
    });
    await newContact.save();
    res.status(201).json(newContact);
  } catch (error) {
    console.error('Error adding doctor contact:', error);
    res.status(500).send('Failed to add doctor contact');
  }
});

// Fetch all doctor's and consultant's contacts
app.get('/get_doctor_contacts', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const contacts = await DoctorContact.find({ userId });
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching doctor contacts:', error);
    res.status(500).send('Failed to fetch doctor contacts');
  }
});

// Fetch a single doctor's or consultant's contact for editing
app.get('/get_doctor_contact/:id', ensureAuthenticated, async (req, res) => {
  try {
    const contact = await DoctorContact.findById(req.params.id);
    if (!contact) return res.status(404).send('Contact not found');
    res.json(contact);
  } catch (error) {
    console.error('Error fetching doctor contact:', error);
    res.status(500).send('Failed to fetch doctor contact');
  }
});

// Update a doctor's or consultant's contact
app.put('/update_doctor_contact/:id', ensureAuthenticated, async (req, res) => {
  try {
    const validationError = validateContactData(req.body);
    if (validationError) {
      return res.status(400).send(validationError);
    }

    const updatedContact = await DoctorContact.findByIdAndUpdate(
      req.params.id,
      {
        contactType: req.body.contactType,
        name: req.body.name,
        address: req.body.address,
        telephone: req.body.telephone,
        email: req.body.email,
        updatedAt: Date.now(),
      },
      { new: true }
    );
    if (!updatedContact) return res.status(404).send('Contact not found');
    res.json(updatedContact);
  } catch (error) {
    console.error('Error updating doctor contact:', error);
    res.status(500).send('Failed to update doctor contact');
  }
});

// Delete a doctor's or consultant's contact
app.delete('/delete_doctor_contact/:id', ensureAuthenticated, async (req, res) => {
  try {
    const deletedContact = await DoctorContact.findByIdAndDelete(req.params.id);
    if (!deletedContact) return res.status(404).send('Contact not found');
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting doctor contact:', error);
    res.status(500).send('Failed to delete doctor contact');
  }
});

// Route to handle saving or updating reminder
app.post("/api/setReminder", ensureAuthenticated, async (req, res) => {
  try {
    const { initialDate, frequency } = req.body;
    const userId = req.session.userId; // Get the user's ID from the session

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' }); // Unauthorized if no userId
    }

    // Log the received data
    console.log("Received data:", { initialDate, frequency, userId });

    // Convert initialDate from ISO string to Date object
    const initialDateObj = new Date(initialDate);
    
    // Calculate the next collection date based on frequency
    const nextCollectionDate = new Date(initialDateObj);
    nextCollectionDate.setDate(nextCollectionDate.getDate() + frequency * 7); // Convert weeks to days

    // Log the calculated next collection date
    console.log("Calculated nextCollectionDate:", nextCollectionDate);

    // Find the existing reminder and update it, or create a new one if none exists
    const reminder = await Reminder.findOneAndUpdate(
      { userId },
      { initialDate: initialDateObj, frequency, nextCollectionDate },
      { new: true, upsert: true } // `new: true` returns the updated document, `upsert: true` creates a new document if none exists
    );

    res.status(200).send("Reminder saved successfully.");
  } catch (error) {
    console.error("Error saving reminder:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to fetch the latest reminder
app.get("/api/getReminder", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId; // Get the user's ID from the session
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' }); // Unauthorized if no userId
    }

    // Fetch the latest reminder for the user
    const reminder = await Reminder.findOne({ userId }).sort({ nextCollectionDate: -1 }).exec();
    if (!reminder) {
      // No reminder found, send a specific message
      return res.json({ message: 'No reminder set' });
    }

    // Return the reminder
    res.json(reminder);
  } catch (error) {
    console.error("Error fetching reminder:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to clear the reminder
app.delete("/api/clearReminder", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId; // Get the user's ID from the session
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' }); // Unauthorized if no userId
    }
    // Remove the reminder for the user
    const result = await Reminder.deleteOne({ userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'No reminder found to clear' });
    }

    res.status(200).send("Reminder cleared successfully.");
  } catch (error) {
    console.error("Error clearing reminder:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Helper function to add days to a date
function addDays(date, days) {
  const result = new Date(date); // Create a copy of the date
  result.setDate(result.getDate() + days); // Add days
  return result; // Return the new date
}

// Route to get upcoming GP Visits within the next 28 days
app.get('/api/get_upcoming_gp_visits', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId; // Get the user's ID from the session
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' }); // Unauthorized if no userId
    }

    const now = new Date(); // Current date
    const in28Days = addDays(now, 28); // Calculate date 28 days from now

    // Fetch upcoming GP visits for the user within the date range
    const upcomingGPVisits = await GPVisit.find({
      userId: userId,
      date: { $gte: now, $lte: in28Days }
    }).sort({ date: 1 });

    res.json(upcomingGPVisits); // Send response with GP visits
  } catch (error) {
    console.error('Error fetching upcoming GP visits:', error);
    res.status(500).json({ error: 'Internal Server Error' }); // Error handling
  }
});

// Route to get upcoming Hospital Visits within the next 28 days
app.get('/api/get_upcoming_hospital_visits', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId; // Get the user's ID from the session
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' }); // Unauthorized if no userId
    }

    const now = new Date(); // Current date
    const in28Days = addDays(now, 28); // Calculate date 28 days from now

    // Fetch upcoming hospital visits for the user within the date range
    const upcomingHospitalVisits = await HospitalVisit.find({
      userId: userId,
      date: { $gte: now, $lte: in28Days }
    }).sort({ date: 1 });

    res.json(upcomingHospitalVisits); // Send response with hospital visits
  } catch (error) {
    console.error('Error fetching upcoming hospital visits:', error);
    res.status(500).json({ error: 'Internal Server Error' }); // Error handling
  }
});

// Route to get upcoming Dentist Visits within the next 28 days
app.get('/api/get_upcoming_dentist_visits', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId; // Get the user's ID from the session
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' }); // Unauthorized if no userId
    }

    const now = new Date(); // Current date
    const in28Days = addDays(now, 28); // Calculate date 28 days from now

    // Fetch upcoming dentist visits for the user within the date range
    const upcomingDentistVisits = await DentistVisit.find({
      userId: userId,
      date: { $gte: now, $lte: in28Days }
    }).sort({ date: 1 });

    res.json(upcomingDentistVisits); // Send response with dentist visits
  } catch (error) {
    console.error('Error fetching upcoming dentist visits:', error);
    res.status(500).json({ error: 'Internal Server Error' }); // Error handling
  }
});

// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.redirect('/login?error=logoutFailed');
    }

    res.redirect('/login?logout=true');
  });
});

// Welcome Screen Route
app.get('/welcome', (req, res) => {
    res.sendFile(__dirname + '/views/welcome.html');
});

// Serve the registration form
app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/views/register.html');
});

// Serve the login form
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/views/login.html');
});

// User Details Page Route
app.get('/user_details', (req, res) => {
    console.log("Request received for user details page.");
    res.sendFile(__dirname + '/views/user_details.html');
});


// My Diary Page Route
app.get('/my_diary', (req, res) => {
    res.sendFile(__dirname + '/views/my_diary.html');
});

// Emergency Contact Page Route
app.get('/emergency_contact', (req, res) => {
    res.sendFile(__dirname + '/views/emergency_contact.html');
});

// Doctor's Contact Page Route
app.get('/doctors_contact', (req, res) => {
    res.sendFile(__dirname + '/views/doctors_contact.html');
});

// Medication Entry Page Route
app.get('/medication_entry', (req, res) => {
    res.sendFile(__dirname + '/views/medication_entry.html');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));