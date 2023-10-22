const request = require('supertest');
const app = require('../index');
const mongoose = require('mongoose');
const Mockgoose = require('mockgoose').Mockgoose;

beforeAll(async () => {
  // Instantiate mockgoose
  mockgoose = new Mockgoose(mongoose);
  await mockgoose.prepareStorage();

  await mongoose.connect('mongodb://localhost/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mockgoose.shutdown();
});

describe('Update Contact Endpoint', () => {
  let authToken;
  let contactId;


  beforeAll(async () => {
    // Log in and get a valid token for the user
    const loginResponse = await request(app)
      .post('/login')
      .send({ email: 'hellomanbear@yahoo.com', password: 'password' });

    authToken = loginResponse.body.token;

    // Contact to update and get its contactId
    const createContactResponse = await request(app)
      .post('/contact-add')
      .set('x-access-token', authToken)
      .send({
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '1234567890',
      });

    contactId = createContactResponse.body.contact._id;
  });

  afterAll(async () => {
    // Log out the user, if needed
    await request(app)
      .post('/logout')
      .set('x-access-token', authToken);
  });

  it('should update a contact with valid data', async () => {
    const updatedContactData = {
      firstName: 'Jane',
      lastName: 'Smith',
      phoneNumber: '9876543210',
    };

    const response = await request(app)
      .put(`/contact-update/${contactId}`)
      .set('x-access-token', authToken)
      .send(updatedContactData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Contact updated successfully');
    expect(response.body.contact.firstName).toBe('Jane');
    expect(response.body.contact.lastName).toBe('Smith');
    expect(response.body.contact.phoneNumber).toBe('9876543210');
  });

  it('should handle invalid data', async () => {
    // Simulate a request with invalid data (e.g., empty firstName)
    const response = await request(app)
      .put(`/contact-update/${contactId}`)
      .send({ firstName: '', lastName: 'Doe', phoneNumber: '1234567890' })
      .set('x-access-token', authToken);
  
    expect(response.status).toBe(400); // Expect a bad request status code (or the appropriate code for invalid data)
    expect(response.body.message).toEqual('Invalid data'); // Check the expected response message
  });
  
  
  it('should handle updating a non-existent contact', async () => {
    const contactId = 'nonExistentContactId';
    // Simulate a request to update a non-existent contact
    const response = await request(app)
      .put(`/contact-update/${contactId}`)
      .send({ firstName: 'John', lastName: 'Doe', phoneNumber: '1234567890' })
      .set('x-access-token', 'yourValidToken'); // Replace with a valid token
  
    expect(response.status).toBe(404); // Expect a not found status code
    expect(response.body.message).toEqual('Contact not found'); // Check the expected response message
  });
  
}, 10000);
