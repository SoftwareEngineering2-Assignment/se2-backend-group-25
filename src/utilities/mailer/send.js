// import SendGrid mail client library and set API key
const sg = require('@sendgrid/mail');
sg.setApiKey(process.env.SENDGRID_API_KEY);

// export a function that sends an email to a user
module.exports = (to, subject, email) => {

  /**
   * @name sendEmail
   * @description Is used to send an email to a user
   */

  // create an object to specify the email's sender, recipient, subject, and HTML content
  const msg = {
    from: "karanikio@auth.gr",
    to,
    subject,
    html: email
  };

  // log the message for debugging purposes
  console.log(msg);

  // send the message using the SendGrid client library
  sg.send(msg)
    .then(() => console.log("HERE"))
    .catch(err => console.log(err));
};
