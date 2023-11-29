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
    phone: string;
    email: string;
    assist: string;
    subscribe: string;
    gallery: string;
    designer: string;
    product: string;
    productUrl: string;
    handle: string;
    to: string;
    cc: string;
    from: string;
  };

  //automatically generated snippet from the email preview
  //sends a request to an email handler for a inquire email
  await fetch(`${process.env.URL}/.netlify/functions/emails/inquire`, {
    headers: {
      "netlify-emails-secret": process.env.NETLIFY_EMAILS_SECRET as string,
    },
    method: "POST",
    body: JSON.stringify({
      from: requestBody.from,
      to: requestBody.to,
      cc: requestBody.cc,
      subject: "Design Miami/ Product Inquiry",
      parameters: {
        firstName: requestBody.firstName,
        lastName: requestBody.lastName,
        phone: requestBody.phone,
        email: requestBody.email,
        assist: requestBody.assist,
        subscribe: requestBody.subscribe,
        gallery: requestBody.gallery,
        designer: requestBody.designer,
        product: requestBody.product,
        productUrl: requestBody.productUrl,
        handle: `https://designmiami.com/products/${requestBody.handle}`,
      },
    }),
  });

  return {
    statusCode: 200,
    body: JSON.stringify("Inquire email sent!"),
  };
};

export { handler };
