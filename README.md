# yousign-adapter

## Installation

```bash
#npm
npm install yousign-v3-client

#yarn
yarn add yousign-v3-client

#pnpm
pnpm add yousign-v3-client

#bun
bun add yousign-v3-client
```

## Useful documentation

- [YouSign API](https://developers.yousign.com/docs/introduction-new) is the main documentation for the YouSign API.
- [Hookable](https://unjs.io/packages/hookable) is the documentation for the hooks system to extend the client.
- [Ofetch](https://unjs.io/packages/ofetch) library used to make the requests, you can use it to make calls to the API without
  needing to pass everything like baseUrl, auth headers etc every time.

## Compatibility

The library is compatible with Node.js, Deno, Bun, browsers (not suggested) and Edge Runtime.
For node esm and cjs are supported.

## Basic Usage

```ts
   import { YouSignClient } from 'yousign-v3-client';

  const yousign = new YouSignClient(process.env.YOUSIGN_API_KEY, {environment: 'sandbox'});

  //1. Create a signature request
  const signatureRequest = await yousign.createSignatureRequest({ name: signatureName, delivery_mode: 'email' });
  //2. Add the files to the signature request
  await yousign.addDocument(signatureRequest.value!.id, {
   file,
   nature: "signable_document",
   parse_anchors: true,
  })
  //3.Add signers to the signature request
  await yousign.addSigner(signatureRequest.value!.id, {
   signature_level: 'electronic_signature',
   info: {
     first_name,
     last_name,
     email
       phone_number,
       locale
     },
     signature_authentication_mode: 'otp_sms',
     fields: [
       {
         type: 'signature',
         document_id: file.id,
         page: 1,
         x: 0,
         y: 0
       }
     ]
   })
  //4. Activate signature request
  await yousign.activateSignature(signatureRequest.id);
```

## Hooks

Should be pretty self explanatory, but the hooks are overall structured as follows:

- When an action is called, a hook is called with the arguments. The hook name starts with `onBeginActionName`
- When an action is completed, a hook is called with the response data from the API. The hook name starts with `onAFterActionName`
- There is a general hook called `onError` which is called when an error occurs in any step of the process.

Hooks are implemented using the [hookable](https://unjs.io/packages/hookable) library.

## Fetch

If you want to make a request to the API without using the hooks, you can use the client.fetch member variable. The client.fetch has
everything set up to make a request to the API with the correct headers and baseUrl already set up.
The only thing you would need to do is passing the correct body/query params to the fetch function and the path to the API.
the fetch function is based on the [ofetch](https://unjs.io/packages/ofetch) library.
