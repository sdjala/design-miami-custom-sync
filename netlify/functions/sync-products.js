import {createClient} from "@sanity/client";

// Document type for all incoming synced Shopify products
const SHOPIFY_PRODUCT_DOCUMENT_TYPE = "shopify.product";

// Prefix added to all Sanity product document ids
const SHOPIFY_PRODUCT_DOCUMENT_ID_PREFIX = "product-";

// Enter your Sanity studio details here.
// You will also need to provide an API token with write access in order for this
// handler to be able to create documents on your behalf.
// Read more on auth, tokens and securing them: https://www.sanity.io/docs/http-auth
const sanityClient = createClient({
  apiVersion: process.env.SANITY_API_VERSION,
  dataset: process.env.SANITY_DATASET,
  projectId: process.env.SANITY_PROJECT_ID,
  token: process.env.SANITY_ADMIN_AUTH_TOKEN,
  useCdn: false,
});

/**
 * Sanity Connect sends POST requests and expects both:
 * - a 200 status code
 * - a response header with `content-type: application/json`
 * 
 * Remember that this may be run in batches when manually syncing.
 */
export const handler = async (event, context) => {
  
  // Next.js will automatically parse `req.body` with requests of `content-type: application/json`,
  // so manually parsing with `JSON.parse` is unnecessary.
  const { body, httpMethod } = event;

  // Ignore non-POST requests
  if (httpMethod !== "POST") {
    return {statusCode: 405, body: "Method not allowed" };
  }

  try {
    const transaction = sanityClient.transaction();
    console.log("🚀 ~ file: sync-products.js:41 ~ handler ~ transaction:", transaction)
    switch (body.action) {
      case "create":
      case "update":
      case "sync":
        await createOrUpdateProducts(transaction, body.products);
        break;
      case "delete":
        const documentIds = body.productIds.map((id) =>
          getDocumentProductId(id)
        );
        await deleteProducts(transaction, documentIds);
        break;
    }
    await transaction.commit();
  } catch (err) {
    console.error("Transaction failed: ", err.message);
  }

  return {statusCode: 200, body: "OK" };
}

/**
 * Creates (or updates if already existing) Sanity documents of type `shopify.product`.
 * Patches existing drafts too, if present.
 *
 * All products will be created with a deterministic _id in the format `product-${SHOPIFY_ID}`
 */
const createOrUpdateProducts = async (transaction, products) =>  {
  // Extract draft document IDs from current update
  const draftDocumentIds = products.map((product) => {
    const productId = extractIdFromGid(product.id);
    return `drafts.${getDocumentProductId(productId)}`;
  });

  // Determine if drafts exist for any updated products
  const existingDrafts = await sanityClient.fetch(`*[_id in $ids]._id`, {
    ids: draftDocumentIds,
  });

  products.forEach((product) => {
    // Build Sanity product document
    const document = buildProductDocument(product);
    const draftId = `drafts.${document._id}`;

    // Create (or update) existing published document
    transaction
      .createIfNotExists(document)
      .patch(document._id, (patch) => patch.set(document));

    // Check if this product has a corresponding draft and if so, update that too.
    if (existingDrafts.includes(draftId)) {
      transaction.patch(draftId, (patch) =>
        patch.set({
          ...document,
          _id: draftId,
        })
      );
    }
  });
}

/**
 * Delete corresponding Sanity documents of type `shopify.product`.
 * Published and draft documents will be deleted.
 */
const deleteProducts = async (transaction, documentIds) => {
  documentIds.forEach((id) => {
    transaction.delete(id).delete(`drafts.${id}`);
  });
}

/**
 * Build Sanity document from product payload
 */
const buildProductDocument = (product) => {
  const {
    featuredImage,
    id,
    options,
    productType,
    priceRange,
    status,
    title,
    variants,
  } = product;
  const productId = extractIdFromGid(id);
  return {
    _id: getDocumentProductId(productId),
    _type: SHOPIFY_PRODUCT_DOCUMENT_TYPE,
    image: featuredImage?.src,
    options: options?.map((option, index) => ({
      _key: String(index),
      name: option.name,
      position: option.position,
      values: option.values,
    })),
    priceRange,
    productType,
    status,
    title,
    variants: variants?.map((variant, index) => {
      const variantId = extractIdFromGid(variant.id);
      return {
        _key: String(index),
        compareAtPrice: Number(variant.compareAtPrice || 0),
        id: variantId,
        inStock: !!variant.inventoryManagement
          ? variant.inventoryPolicy === "continue" ||
            variant.inventoryQuantity > 0
          : true,
        inventoryManagement: variant.inventoryManagement,
        inventoryPolicy: variant.inventoryPolicy,
        option1: variant?.selectedOptions?.[0]?.value,
        option2: variant?.selectedOptions?.[1]?.value,
        option3: variant?.selectedOptions?.[2]?.value,
        price: Number(variant.price || 0),
        sku: variant.sku,
        title: variant.title,
      };
    }),
  };
}

/**
 * Extract ID from Shopify GID string (all values after the last slash)
 * e.g. gid://shopify/Product/12345 => 12345
 */
const extractIdFromGid = (gid) => {
  return gid?.match(/[^\/]+$/i)[0];
}

/**
 * Map Shopify product ID number to a corresponding Sanity document ID string
 * e.g. 12345 => product-12345
 */
const getDocumentProductId = (productId) => {
  return `${SHOPIFY_PRODUCT_DOCUMENT_ID_PREFIX}${productId}`;
}