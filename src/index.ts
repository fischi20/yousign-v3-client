import { $fetch, type $Fetch } from "ofetch";
export * from "./decorators";
export * from "./types";

import type {
  AddedFile,
  AddFileOptions,
  AddSignerOptions,
  AddSignerResponse,
  CertificateData,
  ClientOptions,
  CreateSignatureRequestOptions,
  DocumentInfo,
  Hooks,
  SignatureRequest,
  SignatureRequestActivateResponse,
  SignatureRequestQuery,
  SignatureRequestQueryResult,
} from "./types";

import { GenHooks } from "./decorators";

import { createHooks, Hookable, HookKeys } from "hookable";

function riseError(...args: Parameters<ErrorConstructor>): never {
  throw new Error(...args);
}

//TODO Client and hookable Client are separate classes for typesafety and autoimplementation of hooks

//TODO add hooks to extend functionality (e.g. hooks, prepare data before sending it if needed etc)

export class BaseClient {
  readonly fetch: $Fetch;

  /**
   * Create a new YouSign adapter instance
   * @param apiKey YouSign API key
   */
  constructor(apiKey: string, options?: ClientOptions) {
    if (!apiKey) {
      throw new Error("YouSign API key is required and not provided");
    }

    if (options) {
      const baseURL =
        options.environment === "sandbox"
          ? "https://api-sandbox.yousign.app/v3"
          : options.environment === "production"
            ? "https://api.yousign.app/v3"
            : riseError(`Invalid environment: ${options.environment}`);

      this.fetch = $fetch.create({
        baseURL,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
    }
  }

  /**
   * Create a new signature request
   * @param name Name of the signature request
   * @param delivery_mode If email is passed, signers will receive an email to sign the document
   * @param timezone
   * @returns the signature request or an error
   */
  async createSignatureRequest(
    options: CreateSignatureRequestOptions,
  ): Promise<SignatureRequest> {
    //TODO expand with all the options
    const response = await this.fetch<SignatureRequest>("/signature_requests", {
      method: "POST",
      body: options,
    });
    return response;
  }

  //TODO add mulltiple files with 1 function call support
  /**
   * Adds a document to a signature request
   * @param signatureRequestId Signature request id where to add the document
   * @param options document options
   * @returns
   */
  async addDocument(
    signatureRequestId: string,
    options: AddFileOptions,
  ): Promise<AddedFile> {
    let { file, ...rest } = options;
    if (!(file instanceof File) && !(file instanceof Blob)) {
      if (typeof file === "string") {
        const blob = await $fetch(file, {
          responseType: "blob",
        });

        const fileName = file.split("/").pop();

        file = new File([blob], fileName);

        console.log("Loaded file: ", file);
      } else {
        const content = await $fetch(file.url, {
          responseType: "arrayBuffer",
          headers: file.headers,
        });

        const decoder = new TextDecoder(file.encoding);
        const body = decoder.decode(content);

        //read the content and decode it using the encoding prop
        file = new Blob([body], { type: file.mimeType });
        console.log("Loaded file from base64?: ", file);
      }
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("nature", rest.nature);
    rest.insert_after_id &&
      formData.append("insert_after_id", rest.insert_after_id);

    rest.password && formData.append("password", rest.password);

    rest.initials && formData.append("initials", JSON.stringify(rest.initials));

    rest.parse_anchors &&
      formData.append("parse_anchors", rest.parse_anchors.toString());

    const response = await this.fetch<AddedFile>(
      `/signature_requests/${signatureRequestId}/documents`,
      {
        method: "POST",
        body: formData,
      },
    );

    return response;
  }

  //TODO add multiple signers with 1 function call support
  /**
   * Adds a person that needs to sign the document to a signature request
   * @param signatureRequestId
   * @param options
   * @returns
   */
  async addSigner(
    signatureRequestId: string,
    options: AddSignerOptions,
  ): Promise<AddSignerResponse> {
    const response = await this.fetch<AddSignerResponse>(
      `/signature_requests/${signatureRequestId}/signers`,
      {
        method: "POST",
        body: options,
      },
    );

    return response;
  }

  /**
   * Performs the signature request
   * @param signatureRequestId
   * @returns
   */
  async activateSignatureRequest(
    signatureRequestId: string,
  ): Promise<SignatureRequestActivateResponse> {
    const response = await this.fetch<SignatureRequestActivateResponse>(
      `/signature_requests/${signatureRequestId}/activate`,
      {
        method: "POST",
        ignoreResponseError: true,
      },
    );
    return response;
  }

  /**
   * Get all the signature requests that match the query
   * @param query
   * @returns
   */
  async getRequests(
    query: Partial<SignatureRequestQuery> = {},
  ): Promise<SignatureRequestQueryResult> {
    const response = await this.fetch<SignatureRequestQueryResult>(
      "/signature_requests",
      {
        query,
      },
    );
    return response;
  }

  /**
   * Gets the document from the request
   * @param signatureRequestId
   * @param documentId
   * @returns
   */
  async getDocument(
    signatureRequestId: string,
    documentId: string,
  ): Promise<Blob> {
    const response = await this.fetch(
      `/signature_requests/${signatureRequestId}/documents/${documentId}/download`,
      {
        responseType: "blob",
      },
    );
    return response;
  }

  /**
   * Get all the metadata stored about the file belonging to the signature request
   * @param signatureRequestId
   * @param documentId
   * @returns
   */
  async getDocumentData(
    signatureRequestId: string,
    documentId: string,
  ): Promise<DocumentInfo> {
    const response = await this.fetch<DocumentInfo>(
      `/signature_requests/${signatureRequestId}/documents/${documentId}`,
    );

    return response;
  }

  /**
   * Get all the metadata of all the files relevant for the signature request
   * @param signatureRequestId
   * @returns
   */
  async getSignatureDocumentsData(
    signatureRequestId: string,
  ): Promise<DocumentInfo[]> {
    const response = await this.fetch<DocumentInfo[]>(
      `/signature_requests/${signatureRequestId}/documents`,
    );

    return response;
  }

  /**
   * Gets the certificate data, useful to display it online, or to generate a certificate from it if needed
   * @param signatureRequestId
   * @param signerId
   * @returns
   */
  async getCertificateData(
    signatureRequestId: string,
    signerId: string,
  ): Promise<CertificateData> {
    const response = await this.fetch<CertificateData>(
      `/signature_requests/${signatureRequestId}/signers/${signerId}/audit_trails`,
    );
    return response;
  }

  /**
   * Gets the certificate of the signer that matches the signerId
   * @param signatureRequestId
   * @param signerId
   */
  async getCertificate(
    signatureRequestId: string,
    signerId: string,
  ): Promise<Blob>;
  /**
   * Gets the certificate for each signer of the signature request
   * @param signatureRequestId
   * @param mergeDocuments If true, the documents will be merged into one PDF file, else each document will be downloaded separately
   */
  async getCertificate(
    signatureRequestId: string,
    mergeDocuments?: boolean,
  ): Promise<Blob>;
  async getCertificate(
    signatureRequestId: string,
    signerId: string | boolean = true,
  ): Promise<Blob> {
    switch (typeof signerId) {
      case "string": {
        const response = await this.fetch(
          `/signature_requests/${signatureRequestId}/signers/${signerId}/audit_trails/download`,
          { responseType: "blob" },
        );
        return response;
      }
      case "boolean": {
        const response = await this.fetch(
          `/signature_requests/${signatureRequestId}/audit_trails/download`,
          { responseType: "blob" },
        );
        return response;
      }
      default: {
        const error = new Error(
          `Invalid signerId type: ${typeof signerId}: ${JSON.stringify(
            signerId,
          )}`,
        );
        throw error;
      }
    }
  }
}

/**
 * YouSign adapter for the V3 REST API
 * @param token YouSign API key
 * @param options Options for the client
 * @default options.environment = 'sandbox'
 *
 * @example ```js
 *  import { YouSignClient } from 'yousign-v3-client';
 *
 * const yousign = new YouSignClient(process.env.YOUSIGN_API_KEY);
 *
 * //1. Create a signature request
 * const signatureRequest = await yousign.createSignatureRequest({ name: signatureName, delivery_mode: 'email' });
 * //2. Add the files to the signature request
 * await yousign.addDocument(signatureRequest.value!.id, {
 *  file,
 *  nature: "signable_document",
 *  parse_anchors: true,
 * })
 * //3.Add signers to the signature request
 * await yousign.addSigner(signatureRequest.value!.id, {
 *  signature_level: 'electronic_signature',
 *  info: {
 *    first_name,
 *    last_name,
 *    email
 *      phone_number,
 *      locale
 *    },
 *    signature_authentication_mode: 'otp_sms',
 *    fields: [
 *      {
 *        type: 'signature',
 *        document_id: file.id,
 *        page: 1,
 *        x: 0,
 *        y: 0
 *      }
 *    ]
 *  })
 * //4. Activate signature request
 * await yousign.activateSignature(signatureRequest.id);
 * ```
 */
@GenHooks
export class YouSignClient extends BaseClient {
  readonly hooks: Hookable<Hooks<BaseClient>, HookKeys<Hooks<BaseClient>>> =
    createHooks<Hooks<BaseClient>>();

  constructor(
    token: string,
    options: ClientOptions = { environment: "sandbox" },
  ) {
    super(token, options);
    const baseURL =
      options.environment === "sandbox"
        ? "https://api-sandbox.yousign.app/v3"
        : options.environment === "production"
          ? "https://api.yousign.app/v3"
          : riseError(`Invalid environment: ${options.environment}`);
    //@ts-ignore
    this.fetch = $fetch.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      onResponseError: (context) => {
        this.hooks.callHook("onError", context.error);
      },
      onRequestError: (context) => {
        this.hooks.callHook("onError", context.error);
      },
    });
  }
}
