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
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    subject: string;
    to: string;
    cc: string;
    from: string;
  };

  //automatically generated snippet from the email preview
  //sends a request to an email handler for a curatorial-lab us email
  await fetch(`${process.env.URL}/.netlify/functions/emails/curatorial-lab`, {
    headers: {
      "netlify-emails-secret": process.env.NETLIFY_EMAILS_SECRET as string,
    },
    method: "POST",
    body: JSON.stringify({
      from: requestBody.from,
      to: requestBody.to,
      cc: requestBody.cc,
      subject: "Design Miami Get in touch",
      parameters: {
        firstName: requestBody.firstName,
        lastName: requestBody.lastName,
        email: requestBody.email,
        phone: requestBody.phone,
        subject: requestBody.subject,
      },
    }),
  });

  return {
    statusCode: 200,
    body: JSON.stringify("Get in touch email sent!"),
  };
};

export { handler };
