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
    galleryName: string;
    specialty: string;
    city: string;
    country: string;
    yearFounded: string;
    primaryContactName: string;
    primaryPosition: string;
    primaryMobile: string;
    primaryEmail: string;
    secondaryContactName: string;
    secondaryPosition: string;
    secondaryMobile: string;
    secondaryEmail: string;
    assist: string;
    regionalshows: string;
    program: string;
    platform: string;
    to: string;
    from: string;
  };

  //automatically generated snippet from the email preview
  //sends a request to an email handler for a inquire email
  await fetch(`${process.env.URL}/.netlify/functions/emails/inquire-exhibitor`, {
    headers: {
      "netlify-emails-secret": process.env.NETLIFY_EMAILS_SECRET as string,
    },
    method: "POST",
    body: JSON.stringify({
      from: requestBody.from,
      to: requestBody.to,
      subject: "Design Miami Exhibitor Inquire",
      parameters: {
        galleryName: requestBody.galleryName,
        specialty: requestBody.specialty,
        city: requestBody.city,
        country: requestBody.country,
        yearFounded: requestBody.yearFounded,
        primaryContactName: requestBody.primaryContactName,
        primaryPosition: requestBody.primaryPosition,
        primaryMobile: requestBody.primaryMobile,
        primaryEmail: requestBody.primaryEmail,
        secondaryContactName: requestBody.secondaryContactName,
        secondaryPosition: requestBody.secondaryPosition,
        secondaryMobile: requestBody.secondaryMobile,
        secondaryEmail: requestBody.secondaryEmail,
        assist: requestBody.assist,
        regionalshows: requestBody.regionalshows,
        program: requestBody.program,
        platform: requestBody.platform,
      },
    }),
  });

  return {
    statusCode: 200,
    body: JSON.stringify("Inquire email sent!"),
  };
};

export { handler };
