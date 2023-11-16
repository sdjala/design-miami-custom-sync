import type { Handler } from "@netlify/functions";
import fetch from "node-fetch";

const handler: Handler = async function(event) {
  if (event.body === null) {
    return {
      statusCode: 400,
      body: JSON.stringify("Payload required"),
    };
  }

  const requestBody = JSON.parse(event.body) as {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    to: string;
    from: string;
  };

  //automatically generated snippet from the email preview
  //sends a request to an email handler for a contact us email
  await fetch(`${process.env.URL}/.netlify/functions/emails/contact-us`, {
    headers: {
      "netlify-emails-secret": process.env.NETLIFY_EMAILS_SECRET as string,
    },
    method: "POST",
    body: JSON.stringify({
      from: requestBody.from,
      to: requestBody.to,
      subject: "Design Miami Contact us",
      parameters: {
        name: requestBody.name,
        email: requestBody.email,
        phone: requestBody.phone,
        subject: requestBody.subject,
        message: requestBody.message,
      },
    }),
  });

  return {
    statusCode: 200,
    body: JSON.stringify("Contact us email sent!"),
  };
};

export { handler };
