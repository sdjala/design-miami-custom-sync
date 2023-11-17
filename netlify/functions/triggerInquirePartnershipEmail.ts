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
    date: string;
    companyName: string;
    companyWebsite: string;
    contactPerson: string;
    jobTitle: string;
    email: string;
    mobile: string;
    position: string;
    assist: string;
    regionalshows: string;
    to: string;
    from: string;
  };

  //automatically generated snippet from the email preview
  //sends a request to an email handler for a inquire email
  await fetch(`${process.env.URL}/.netlify/functions/emails/inquire-partnership`, {
    headers: {
      "netlify-emails-secret": process.env.NETLIFY_EMAILS_SECRET as string,
    },
    method: "POST",
    body: JSON.stringify({
      from: requestBody.from,
      to: requestBody.to,
      subject: "Design Miami Partnership Inquire",
      parameters: {
        date: requestBody.date,
        companyName: requestBody.companyName,
        companyWebsite: requestBody.companyWebsite,
        contactPerson: requestBody.contactPerson,
        jobTitle: requestBody.jobTitle,
        email: requestBody.email,
        mobile: requestBody.mobile,
        position: requestBody.position,
        assist: requestBody.assist,
        regionalshows: requestBody.regionalshows,
      },
    }),
  });

  return {
    statusCode: 200,
    body: JSON.stringify("Inquire email sent!"),
  };
};

export { handler };
