import type {SanityClient} from '@sanity/client'
import {v5 as uuidv5} from 'uuid'

import {buildProductDocumentId, buildProductVariantDocumentId, commitProductDocuments} from './sanityOps'
import type {ShopifyDocumentProduct, ShopifyDocumentProductVariant} from './storageTypes'

import {
  SHOPIFY_PRODUCT_DOCUMENT_TYPE,
  SHOPIFY_PRODUCT_VARIANT_DOCUMENT_TYPE,
  UUID_NAMESPACE_PRODUCT_VARIANT
} from './constants'
import {DataSinkProduct} from './requestTypes'
import {idFromGid} from './requestHelpers'
import axios from 'axios'

export async function handleProductUpdate(
  client: SanityClient,
  product: DataSinkProduct,
): Promise<{
  productDocument: ShopifyDocumentProduct
  productVariantsDocuments: ShopifyDocumentProductVariant[]
}> {
  const {
    handle,
    id,
    images,
    status,
    priceRange
  } = product

  const variants = product.variants || []
  const firstImage = images?.[0]
  const shopifyProductId = idFromGid(id)

  const productVariantsDocuments = variants.map<ShopifyDocumentProductVariant>((variant) => {
    const variantId = idFromGid(variant.id)
    const variantData = {
      _id: buildProductVariantDocumentId(variantId),
      _type: SHOPIFY_PRODUCT_VARIANT_DOCUMENT_TYPE,
      store: {
        ...variant,
        id: variantId,
        gid: `gid://shopify/ProductVariant/${variant.id}`,
        isDeleted: false,
        option1: variant.selectedOptions?.[0]?.value,
        option2: variant.selectedOptions?.[1]?.value,
        option3: variant.selectedOptions?.[2]?.value,
        previewImageUrl: variant.image?.src,
        price: Number(variant.price),
        compareAtPrice: variant.compareAtPrice ?? 0,
        productGid: variant.product?.id,
        productId: idFromGid(variant.product?.id),
        sku: variant.sku,
        status,
        updatedAt: variant.updatedAt,
        inventory: {
          management: (variant.inventoryManagement || 'not_managed').toUpperCase(),
          policy: (variant.inventoryPolicy || '').toUpperCase(),
          quantity: variant.inventoryQuantity ?? 0,
          isAvailable: variant.inventoryQuantity !== null && variant.inventoryQuantity > 0
        }
      }
    }

    delete variantData.store.barcode;
    delete variantData.store.fulfillmentService;
    delete variantData.store.inventoryManagement;
    delete variantData.store.position;
    delete variantData.store.product;
    delete variantData.store.selectedOptions;

    return variantData
  })

  productVariantsDocuments.map(async(variant) => {
      const res = await axios.get(`https://design-miami.myshopify.com/admin/api/2023-04/products/${shopifyProductId}/variants/${variant?.store?.id}/metafields.json`, {
      headers:{
        'X-Shopify-Access-Token':  process.env.SHOPIFY_TOKEN
      }
    })

     const metafields = res.data.metafields?.map((metafield) => {
      if (metafield.key==='color') {
        variant.store[metafield?.key] = JSON.parse(metafield?.value)
      }

      const value = JSON.parse(metafield.value)
      console.log("🚀 ~ file: productUpdate.ts:89 ~ metafields ~ value:", value)
      return {
        _type: 'metafield',
        _key: metafield.id,
        key: metafield.key,
        value: JSON.stringify(value?.value),
        unit: value?.unit,
        description: metafield.description,
        type: metafield.type,
        namespace: metafield.namespace,
      }
    })
    variant.store.metafields =  metafields
  })

  const options: ShopifyDocumentProduct['store']['options'] =
    product.options.map((option) => ({
      _type: 'option',
      _key: option.id,
      name: option.name,
      values: option.values ?? [],
    })) || []


  const getMetafields = async () => {
     const res = await axios.get(`https://design-miami.myshopify.com/admin/api/2023-04/products/${shopifyProductId}/metafields.json`, {
      headers:{
        'X-Shopify-Access-Token':  process.env.SHOPIFY_TOKEN
      }
    })
     return res.data.metafields
     
  }
  const data = await getMetafields()

 const tags = JSON.stringify(product.tags)?.replace(/[^a-zA-Z ,]/g, '')

  // We assign _key values of product option name and values since they're guaranteed unique in Shopify
  const productDocument: ShopifyDocumentProduct = {
    _id: buildProductDocumentId(shopifyProductId), // Shopify product ID
    _type: SHOPIFY_PRODUCT_DOCUMENT_TYPE,
    store: {
      ...product,
      id: shopifyProductId,
      gid: id,
      isDeleted: false,
      ...(firstImage
        ? {
          previewImageUrl: firstImage.src,
        }
        : {}),
      priceRange,
      slug: {
        _type: 'slug',
        current: handle,
      },
      options,
      tags: tags,
      
      variants: productVariantsDocuments.map((variant) => {
        return {
          _key: uuidv5(variant._id, UUID_NAMESPACE_PRODUCT_VARIANT),
          _type: 'reference',
          _ref: variant._id,
          _weak: true,
        }
      }),
    },
  }

  const metafields: ShopifyDocumentProduct['store']['metafields'] =
  data?.map((metafield) => {
    if (['heritage', 'material', 'style', 'color'].includes(metafield.key)) {
      productDocument.store[metafield.key] = JSON.parse(metafield.value)
    }

    const value = JSON.stringify(metafield?.value)?.replace(/[^a-zA-Z0-9 ,]/g, '')
    return {
      _type: 'metafield',
      _key: metafield.id,
      key: metafield.key,
      value: value,
      description: metafield.description,
      type: metafield.type,
      namespace: metafield.namespace,
    }
  }) || []

  productDocument.store.metafields= metafields

  delete productDocument.store.description
  delete productDocument.store.featuredImage
  delete productDocument.store.handle
  delete productDocument.store.images
  delete productDocument.store.publishedAt

  await commitProductDocuments(client, productDocument, productVariantsDocuments)

  return {productDocument, productVariantsDocuments}
}