# Contact Book App Backend - README
This README will guide you through the installation and usage of the Contact Book App Backend. This backend is built using Node.js and Express, and it provides endpoints for user authentication, contact management, and user details retrieval. Make sure you have Node.js and MongoDB installed on your system before proceeding.

# Prerequisites
Node.js: If you don't have Node.js installed, you can download it [here](https://nodejs.org/en/download).

MongoDB: You need a MongoDB database to store user and contact information. You can set up a MongoDB database locally or use a cloud-based service like MongoDB Atlas.

# Installation
Clone the repository:
git clone https://github.com/KiCodes/jvec-assessment-backend.git
Navigate to the project directory:
cd jvec-assessment-backend


# Install dependencies
npm install
Set up your MongoDB connection:

Open app.js and locate the mongoose.connect method.
Replace the connection string with your MongoDB database URL.
Set your secret key:

Open app.js and locate the secretKey variable.
Replace the value with your secret key. This key is used for JWT token generation and should be kept secure.
Start the server:

npm start
The server will now be running on http://localhost:8000. You can access it through API endpoints.

# API Endpoints
1. User Registration
Endpoint: /api/signup
Method: POST
Description: Register a new user.
Request Body: JSON object with user information (firstName, lastName, phoneNumber, email, password).
Response: Successful registration message or error message.
2. User Login
Endpoint: /api/login
Method: POST
Description: Authenticate and generate a JWT token for the user.
Request Body: JSON object with user email and password.
Response: JWT token on successful login or error message.
3. User Logout
Endpoint: /api/logout
Method: POST
Description: Invalidate the JWT token, logging the user out.
Request Header: x-access-token with the JWT token.
Response: Success message or error message.
4. Save Contact
Endpoint: /api/contact-add
Method: POST
Description: Save a contact for the authenticated user.
Request Header: x-access-token with the JWT token.
Request Body: JSON object with contact information (firstName, lastName, phoneNumber).
Response: Success message or error message.
5. List All Contacts
Endpoint: /api/contact-all
Method: GET
Description: Retrieve all contacts for the authenticated user.
Request Header: x-access-token with the JWT token.
Response: JSON array of contacts or error message.
6. Search Contacts
Endpoint: /api/contacts-search
Method: GET
Description: Search for contacts that match a query string.
Request Header: x-access-token with the JWT token.
Query Parameter: query containing the search string.
Response: JSON array of matching contacts or error message.
7. Update Contact
Endpoint: /api/contact-update/:contactId
Method: PUT
Description: Update a specific contact for the authenticated user.
Request Header: x-access-token with the JWT token.
Request URL Parameter: contactId (ID of the contact to update).
Request Body: JSON object with updated contact information (firstName, lastName, phoneNumber).
Response: Success message or error message.
8. Delete Contact
Endpoint: /api/contact-delete/:contactId
Method: DELETE
Description: Delete a specific contact for the authenticated user.
Request Header: x-access-token with the JWT token.
Request URL Parameter: contactId (ID of the contact to delete).
Response: Success message or error message.
9. Get User Details
Endpoint: /api/user-details
Method: GET
Description: Retrieve user details for the authenticated user.
Request Header: x-access-token with the JWT token.
Response: JSON object with user details or error message.
# Important Notes
Always include the x-access-token header with your JWT token in authenticated endpoints.
Feel free to use these endpoints to build your Contact Book App frontend. If you have any questions or encounter issues, please refer to the code comments or reach out for assistance.
