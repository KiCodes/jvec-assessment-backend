const request = require("supertest");
const app = require("../index");
const mongoose = require("mongoose");
const Mockgoose = require("mockgoose").Mockgoose;

let mockgoose;

beforeAll(async () => {
  // Instantiate mockgoose
  mockgoose = new Mockgoose(mongoose);

  // Start mockgoose
  await mockgoose.prepareStorage();

  // Connect to the mock database
  await mongoose.connect("mongodb://localhost/test", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  // Disconnect and stop mockgoose
  await mongoose.disconnect();
  await mockgoose.shutdown();
});

describe("DELETE /contact-delete/:contactId", () => {
  let authToken;

  beforeAll((done) => {
    // Log in and obtain an authentication token for testing
    request(app)
      .post("/login")
      .send({ email: "hellomanbear@yahoo.com", password: "password" })
      .end((err, response) => {
        authToken = response.body.token;
        done();
      });
  });

  it("should delete a contact", async () => {
    // Add your test contact to the user before testing the delete
    const response = await request(app)
      .post("/contact-add")
      .set("x-access-token", authToken)
      .send({ firstName: "John", lastName: "Doe", phoneNumber: "1234567890" });

    const contactId = response.body.contact._id;

    // Perform the delete request
    const res = await request(app)
      .delete(`/contact-delete/${contactId}`)
      .set("x-access-token", authToken);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Contact deleted successfully");
  });

  afterAll(async () => {
    // Cleanup: Remove any user data and close the database connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });
}, 10000);
