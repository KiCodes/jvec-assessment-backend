const express = require("express");
const { body, validationResult } = require("express-validator");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const jwt = require("jsonwebtoken");


secretKey = "119e80195e385d22a08ed7b06383240f6aa885b6c6afb52c57414015f323e1fc1f03090e483a6fcd1738b54bb394e4f7d23adcef7306793001d531b15e8ef734";

// console.log("Secret Key:", secretKey);

const app = express();
const path = require("path")
const port = 8000;
const cors = require("cors");
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());

const invalidatedTokens = [];

mongoose.connect(
    "mongodb+srv://Kicodes:Kicodes@cluster0.dfqslx6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("conncted to mongodb");
  })
  .catch((err) => {
    console.log("erro connecting to mondoDB", err);
  });

app.listen(port, () => {
  console.log("server routing to port", port);
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Handle any other requests and return the React app's index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

const User = require("./models/user");
const { timeStamp } = require("console");

const jwtExpirySeconds = 3000;

// Passport configuration
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
          return done(null, false, { message: "Incorrect email" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return done(null, false, { message: "Incorrect password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// enpoint for signup of user
app.post(
  "/api/signup",
  [body("email").isEmail().withMessage("Invalid email format")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, phoneNumber, email, password } = req.body;

    // Convert the email to lowercase before saving
    const lowerCaseEmail = email.toLowerCase();

    try {
      // Hash the password using bcrypt
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const userPrefix = "My";
      const userSuffix = "Number";

      // Create a new user object with the hashed password
      const newUser = new User({
        firstName,
        lastName,
        phoneNumber,
        email: lowerCaseEmail,
        password: hashedPassword,
        contacts: [],
      });

      const newContact = {
        firstName: userPrefix,
        lastName: userSuffix,
        phoneNumber,
      };

      // Push the new contact into the user's contacts array
      newUser.contacts.push(newContact);

      // Save the user to the database
      await newUser.save();
      res.status(200).json({ message: "User registered successfully" });
    } 
    catch (error) {
      if (error && error.code === 11000) {
        // Duplicate key error, check if it's for email or phone number
        if (error.keyPattern.email) {
          res.status(400).json({ message: "Email already exists" });
        } else if (error.keyPattern["contacts.phoneNumber"]) {
          res.status(400).json({ message: "Phone number already exists" });
        } else {
          // Handle other duplicate key errors as needed
          res.status(400).json({ message: "Duplicate entry found" });
        }
      } else {
        console.error("Error registering user", error);
        res.status(500).json({
          message: "Error registering user",
          error,
        });
      }
    }
  }
);

const verifyToken = (req, res, next) => {
    const token =
      req.body.token || req.query.token || req.headers["x-access-token"];
  
    if (!token) {
      return res.status(403).send("A token is required for authentication");
    }

    if (isTokenBlacklisted(token)) {
        return res.status(401).send("Invalid Token");
      }

    try {
      const decoded = jwt.verify(token, secretKey);
      req.user = decoded;
    } catch (err) {
      console.log("Invalid Token", err);
      return res.status(401).send("Invalid Token");
  
    }
    return next();
  };

// endpoint for login
app.post("/api/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({ message: info.message });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id }, secretKey, {
      expiresIn: jwtExpirySeconds * 10000,
    });

    return res.status(200).json({ token });
  })(req, res, next);
});

  // Function to verify if a token is blacklisted
  const isTokenBlacklisted = (token) => {
    return invalidatedTokens.includes(token);
  };


//endpoint for logout
app.post("/api/logout", verifyToken, (req, res) => {
    const token = req.body.token || req.query.token || req.headers["x-access-token"];
    
    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }
  
    // Store the invalidated token
    invalidatedTokens.push(token);
  
    res.status(200).json({ message: "User logged out successfully" });
  });

//endpoint for saving contact
app.post("/api/contact-add", verifyToken, async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = req.body;

    // Get the authenticated user's ID from the request 
    const userId = req.user.id;

    // Find the authenticated user in the database
    const authenticatedUser = await User.findById(userId);

    if (!authenticatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create a new contact object for the authenticated user
    const newContact = {
      firstName,
      lastName,
      phoneNumber,
    };

    console.log("req user", newContact.firstName, newContact.phoneNumber);

    authenticatedUser.contacts.push(newContact);

    // Save the user with the updated contacts array
    await authenticatedUser.save();

    res
      .status(201)
      .json({ message: "Contact saved successfully", contact: newContact });
  } catch (error) {
    console.error("Error saving contact", error);
    res.status(500).json({ message: "Error saving contact", error });
  }
});

// endpoint for listing all contacts
app.get("/api/contact-all", verifyToken, async (req, res) => {
    try {
      // Get the authenticated user's ID from the request
      const userId = req.user.id;
  
      // Find the authenticated user in the database
      const authenticatedUser = await User.findById(userId);
  
      if (!authenticatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Retrieve the user's contacts
      const userContacts = authenticatedUser.contacts;
  
      res.status(200).json({ contacts: userContacts });
    } catch (error) {
      console.error("Error fetching contacts", error);
      res.status(500).json({ message: "Error fetching contacts", error });
    }
  });

// endpoint for searching contacts
app.get("/api/contacts-search", verifyToken, async (req, res) => {
    try {
      const query = req.query.query;
      const userId = req.user.id;

      const authenticatedUser = await User.findById(userId);
      console.log('query', query);

      if (!authenticatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const filteredContacts = authenticatedUser.contacts.filter((contact) => {
        if (
          contact.firstName.toLowerCase().includes(query) ||
          contact.lastName.toLowerCase().includes(query) ||
          contact.phoneNumber.toLowerCase().includes(query)
        ) {
          return true;
        }
        return false;
      });

      res.status(200).json({ filteredContacts });
    } catch (error) {
      console.error("Error searching contacts", error);
      res.status(500).json({ message: "Error searching contacts", error });
    }
});

// endpoint for Updating a contact
app.put("/api/contact-update/:contactId", verifyToken, async (req, res) => {
    try {
      const { firstName, lastName, phoneNumber } = req.body;
      const userId = req.user.id;
      const contactId = req.params.contactId;

      
      console.log(contactId, firstName, lastName)

      const authenticatedUser = await User.findById(userId);
  
      if (!authenticatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Find the contact to update by its ID
      const contactToUpdate = authenticatedUser.contacts.id(contactId);
  
      if (!contactToUpdate) {
        return res.status(404).json({ message: "Contact not found" });
      }
  
      // Update the contact properties
      if (firstName) contactToUpdate.firstName = firstName;
      if (lastName) contactToUpdate.lastName = lastName;
      if (phoneNumber) contactToUpdate.phoneNumber = phoneNumber;
  
      // Save the user with the updated contact
      await authenticatedUser.save();
  
      res.status(200).json({ message: "Contact updated successfully", contact: contactToUpdate });
    } catch (error) {
      console.error("Error updating contact", error);
      res.status(500).json({ message: "Error updating contact", error });
    }
  });

// endpoint Delete a contact
app.delete("/api/contact-delete/:contactId", verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const contactId = req.params.contactId;
  
      const authenticatedUser = await User.findById(userId);
  
      if (!authenticatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Use `filter` to remove the contact by its ID from the contacts array
      authenticatedUser.contacts = authenticatedUser.contacts.filter((contact) => {
        return contact._id.toString() !== contactId;
      });
  
      // Save the user with the updated contacts array (contact deleted)
      await authenticatedUser.save();
  
      res.status(200).json({ message: "Contact deleted successfully" });
    } catch (error) {
      console.error("Error deleting contact", error);
      res.status(500).json({ message: "Error deleting contact", error });
    }
  });
  
// Endpoint to get user details
app.get("/api/user-details", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the authenticated user in the database
    const authenticatedUser = await User.findById(userId);

    if (!authenticatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract user details
    const userDetails = {
      name: `${authenticatedUser.firstName} ${authenticatedUser.lastName}`,
      email: authenticatedUser.email,
      phone: authenticatedUser.phoneNumber,
    };

    res.status(200).json(userDetails);
  } catch (error) {
    console.error("Error fetching user details", error);
    res.status(500).json({ message: "Error fetching user details", error });
  }
});