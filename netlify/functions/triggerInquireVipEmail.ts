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
    company: string;
    addresLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    assist: string;
    engagement: string;
    income: string;
    agerange: string;
    residences: string;
    to: string;
    cc: string;
    from: string;
  };

  //automatically generated snippet from the email preview
  //sends a request to an email handler for a inquire email
  await fetch(`${process.env.URL}/.netlify/functions/emails/inquire-vip`, {
    headers: {
      "netlify-emails-secret": process.env.NETLIFY_EMAILS_SECRET as string,
    },
    method: "POST",
    body: JSON.stringify({
      from: requestBody.from,
      to: requestBody.to,
      cc: requestBody.cc,
      subject: " Design Miami/ VIP Inquiry",
      parameters: {
        firstName: requestBody.firstName,
        lastName: requestBody.lastName,
        email: requestBody.email,
        company: requestBody.company,
        addresLine1: requestBody.addresLine1,
        addressLine2: requestBody.addressLine2,
        city: requestBody.city,
        state: requestBody.state,
        zipCode: requestBody.zipCode,
        country: requestBody.country,
        assist: requestBody.assist,
        engagement: requestBody.engagement,
        income: requestBody.income,
        agerange: requestBody.agerange,
        residences: requestBody.residences,
      },
    }),
  });

  return {
    statusCode: 200,
    body: JSON.stringify("Inquire email sent!"),
  };
};

export { handler };
