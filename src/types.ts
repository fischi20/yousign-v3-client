import { timezones } from "./timezones";

/** Generic way to make types nullable */
export type Nullable<T> = T | null;

/** Possible statuses for a signature request */
export type SignatureRequestStatus =
  | "draft"
  | "ongoing"
  | "done"
  | "deleted"
  | "expired"
  | "canceled"
  | "approval"
  | "rejected"
  | "declined";

/** Level of the signature, more info in the {@link https://developers.yousign.com/docs/choose-my-signature-level|docs} */
export type SignatureLevel =
  | "electronic_signature"
  | "advanced_electronic_signature"
  | "electronic_signature_with_qualified_certificate"
  | "qualified_electronic_signature"
  | "qualified_electronic_signature_mode_1";

/** All the possible timezones following the {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones|tz database format}*/
export type SignatureTimezone = (typeof timezones)[number]; //TODO type more strictly

/**
 * Delivery mode for the
 * @value none: You are on your own
 * @value email: signer will reveive an email to sign the document
 */
export type DeliveryMode = "none" | "email";

/**
 *Settings on how often relevant users for a signature request shall be reminded
 *and the interval between the reminders
 */
export type ReminderSettings = {
  interval_in_days: 1 | 2 | 7 | 14;
  max_occurrences: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
};

/** Short hand signer and status data of a signature request */
export type SignerInner = {
  id: string;
  status:
    | "initiated"
    | "declined"
    | "notified"
    | "verified"
    | "processing"
    | "consent_given"
    | "signed"
    | "aborted"
    | "error";
};

/** Status of the Approver related to a signature request*/
export type ApproverInner = {
  id: string;
  status: "initiated" | "notified" | "approved" | "rejected";
};

/** Shorthand document info when used in overall Request info etc */
export type DocumentInner = {
  id: string;
  nature: "attachment" | "signable_document";
};

type Sender = {
  id: string;
  email: string;
};

type SignatureDeclineInfo = {
  signer_id: string;
  reason: string;
  decined_at: string;
};

type AuditTrailLocale = "de" | "en" | "es" | "fr" | "it";

type CustomEmailNotificationSender = {
  type: "custom";
  custom_name: string;
};

type OrganizationEmailNotificationSender = {
  type: "organization";
};

type WorkspaceEmailNotificationSender = {
  type: "workspace";
};

/** Sets the field on the sender for the emails (seen in certificates) */
export type EmailNotificationSender =
  | CustomEmailNotificationSender
  | OrganizationEmailNotificationSender
  | WorkspaceEmailNotificationSender;

/** Settings that need to be passed when creating a new signature request */
export type CreateSignatureRequestOptions = {
  name: string;
  delivery_mode: DeliveryMode;
  ordered_signer?: boolean;
  timezone?: SignatureTimezone;
  expiration_date?: string;
  template_id?: string;
  external_id?: string;
  custom_experience_id?: string;
  workspace_id?: string;
  audit_trail_locale?: Nullable<AuditTrailLocale>;
  /** @default false */
  signers_allowed_to_decline?: boolean;
  email_notification?: Nullable<{
    sender: Nullable<EmailNotificationSender>;
    /** Max length 500 characters */
    custom_note?: Nullable<string>;
  }>;
};

/** Info about a created signature */
export type SignatureRequest = {
  id: string;
  status: SignatureRequestStatus;
  name: string;
  delivery_mode: DeliveryMode;
  created_at: string;
  ordered_signers: boolean;
  reminder_settings: Nullable<ReminderSettings>;
  timezone: SignatureTimezone;
  expiration_date: string;
  source:
    | "app"
    | "public_api"
    | "connector_hubspot_api"
    | "connector_salesforce_api"
    | "connector_google_api"
    | "connector_zapier_api";
  signers: SignerInner[];
  approvers: ApproverInner[];
  documents: DocumentInner[];
  sender: Nullable<Sender>;
  external_id: Nullable<string>;
  custom_experience_id: Nullable<string>;
  signers_allowed_to_decline: boolean;
  audit_trail_locale: AuditTrailLocale;
  email_notification: {
    sender: EmailNotificationSender;
    /** @deprecated Probably... not displayed in documentation */
    custom_note: Nullable<string>;
  };
  bulk_send_batch_id: Nullable<string>;
  decline_information: Nullable<SignatureDeclineInfo>;
  /**@deprecated Should always be null and soon to be removed*/
  email_custom_note: Nullable<string>;
  /**@deprecated Should always be null and soon to be removed*/
  branding_id: Nullable<string>;
};

type URLFile =
  | string
  | {
      type: "url";
      url: string;
      encoding?: string;
      headers?: Record<string, string>;
      mimeType?: string;
      fileName?: string;
    };

/** settings that need to be passed when adding a file to a signature request*/
export type AddFileOptions = {
  file: File | Blob | URLFile;
  nature: "attachment" | "signable_document";
  insert_after_id?: string;
  password?: string;
  initials?: Record<string, any>;
  parse_anchors?: boolean;
};

/** Response when a file got added to a signature request */
export type AddFileResponse = {
  id: string;
  filename: string;
  nature: DocumentInner["nature"];
  content_type: string;
  sha256: string;
  is_protected: boolean;
  is_signed: boolean;
  created_at: string;
  total_pages: Nullable<number>;
  is_locked: boolean;
  initials: Nullable<{
    alignment: "left" | "center" | "right";
    y: number;
  }>;
  total_anchors: number;
};

/** signature options that define where and on which document the siganture should be positioned */
export type Signature = {
  document_id: string;
  type: "signature";
  page: number;
  x: number;
  y: number;
  /** @default 37 */
  height?: number;
  /** @default 85 */
  width?: number;
};

/** Mention options */
export type Mention = {
  document_id: string;
  type: "mention";
  page: number;
  x: number;
  y: number;
  height?: number;
  /** min 24, or multiple of 15 > 24 */
  width?: Nullable<number>;
  mention: string;
};

/** Text input options */
export type Text = {
  document_id: string;
  type: "text";
  page: number;
  x: number;
  y: number;
  height?: number;
  width?: number;
  max_length: number;
  question: string;
  instruction: Nullable<string>;
  optional: boolean;
};

/** Checkbox Input options */
export type Checkbox = {
  document_id: string;
  type: "checkbox";
  page: number;
  x: number;
  y: number;
  /** min 8, max 30 */
  size: number;
  optional: boolean;
  name?: Nullable<string>;
  checked: boolean;
};

/** Radio group input options */
export type RadioGroup = {
  document_id: string;
  type: "radio_group";
  page: number;
  optional: boolean;
  name?: Nullable<string>;
  radios: {
    name?: Nullable<string>;
    x: number;
    y: number;
    /** min 8, max 30 */
    size: number;
  }[];
};

/** Options for all the possible anchors/inputs for a document when signing */
export type FieldInput = Signature | Mention | Text | Checkbox | RadioGroup;
/** Supported locales for signers */
export type SignerLocale = "en" | "fr" | "de" | "it" | "nl" | "es" | "pl";
/** Information about who signed */
export type SignerInfo = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: Nullable<string>;
  locale: SignerLocale;
};

/** Method with which the signature shoulld be authenticated */
export type SignatureAuthMode = "otp_email" | "otp_sms" | "no_otp";

/** Redirect URLS in case of the different outcomes, more info on the {@link https://developers.yousign.com/docs/redirect-a-signer-at-the-end-of-the-signing-flow|docs} */
export type RedirectUrls = {
  success: Nullable<string>;
  error: Nullable<string>;
  declined: Nullable<string>;
};

/** Custom text options to for reminders and requests */
export type CustomText = {
  request_subject: Nullable<string>;
  request_body: Nullable<string>;
  reminder_subject: Nullable<string>;
  reminder_body: Nullable<string>;
};

type AddSignerScratchOptions = {
  info: SignerInfo;
  fields?: FieldInput[];
  insert_after_id?: Nullable<string>;
  signature_level: SignatureLevel;
  signature_authentication_mode?: Nullable<SignatureAuthMode>;
  redirect_urls?: Partial<RedirectUrls>;
  custom_text?: Partial<CustomText>;
  delivery_mode?: Nullable<DeliveryMode>;
  identification_attestation_id?: Nullable<string>;
};

//TODO add contacts and user options too
/** Settings that need to get passed when adding a Signer to a signature request */
export type AddSignerOptions = AddSignerScratchOptions;

/** Font options for fields */
export type Font = {
  family:
    | "Inconsolata"
    | "Open Sans"
    | "Lato"
    | "Raleway"
    | "Merriweather"
    | "EB Garamond"
    | "Comic Neue";
  color: string;
  /** min 8, max 22 */
  size: number;
  variants: {
    itaic: boolean;
    bold: boolean;
  };
};

/** Signed signature value */
export type SignerSignature = Required<Signature> & {
  id: string;
  signature_id: string;
};

/** Signed text value */
export type SignerText = Required<Text> & {
  id: string;
  signer_id: string;
  font: Font;
};

/** Signed Mention value */
export type SignerMention = Required<Mention> & {
  id: string;
  signer_id: string;
  font: Font;
};

/** Signed Checkbox value */
export type SignerCheckbox = Required<Checkbox> & {
  id: string;
  signer_id: string;
};

/** Signed Radio group value */
export type SignerRadioGroup = Required<RadioGroup> & {
  id: string;
  signer_id: string;
};

/** Signed input values */
export type SignerFieldInput =
  | SignerSignature
  | SignerText
  | SignerMention
  | SignerCheckbox
  | SignerRadioGroup;

/** Response when a Signer got added to the SignatureRequest */
export type AddSignerResponse = {
  id: string;
  info: SignerInfo;
  //initiated, declined, notified, verified, processing, consent_given, signed, aborted, error
  status:
    | "initiated"
    | "declined"
    | "notified"
    | "verified"
    | "processing"
    | "consent_given"
    | "signed"
    | "aborted"
    | "error";
  fields: SignerFieldInput[];
  signature_level: SignatureLevel;
  signature_authentication_mode: SignatureAuthMode | "null";
  signature_link: Nullable<string>;
  signature_link_expiration_date: Nullable<string>;
  signature_image_preview: Nullable<string>;
  redirect_urls: RedirectUrls;
  custom_text: CustomText;
  delivery_mode: Nullable<DeliveryMode>;
  identification_attestation_id: Nullable<string>;
};

/** Signature activation response, end of normal workflow */
export type SignatureRequestActivateResponse = {
  id: string;
  status: "ongoing" | "approval";
  name: string;
  delivery_mode: DeliveryMode;
  created_at: string;
  reminder_settings: Nullable<ReminderSettings>;
  timezone: SignatureTimezone;
  expiration_date: string;
  signers: {
    id: string;
    status:
      | "initiated"
      | "declined"
      | "notified"
      | "verified"
      | "processing"
      | "consent_given"
      | "signed"
      | "aborted"
      | "error";
    /** @sensiblle */
    signature_link: Nullable<string>;
    signature_link_expiration_date: Nullable<string>;
  }[];
  approvers: {
    id: string;
    status: "initiated" | "notified" | "approved" | "rejected";
    /** @sensible */
    approval_link: Nullable<string>;
    approval_link_expiration_date: Nullable<string>;
  }[];
  documents: DocumentInner[];
  external_id: Nullable<string>;
  branding_id: Nullable<string>;
  custom_experience_id: Nullable<string>;
  audit_trail_locale: AuditTrailLocale;
};

/** Result of the query for signature requests */
export type SignatureRequestQueryResult = {
  meta: {
    /** cursor to pass to the `after`fielld in the {@link SignatureRequestQuery} object */
    next_cursor: Nullable<string>;
  };
  data: SignatureRequest[];
};

/** Query object to search for signature requests */
export type SignatureRequestQuery = {
  /**
   * @default 100
   * @min 1
   * @max 100
   */
  limit: number;
  status: SignatureRequestStatus;
  /**
   * After cursor (pagination)
   */
  after: string;
  external_id: string;
  source: string[];
  /**
   * Search on name
   */
  q: string;
};

/** certificate sender info */
export type SignedSender = {
  id: string;
  type: "User";
  email: string;
  last_name: string;
  first_name: string;
  ip_address: string;
  phone_number: string;
};

/** Certificate signer info */
export type SignedSigner = {
  id: string;
  last_name: string;
  first_name: string;
  ip_address: string;
  phone_number: string;
  email_address: string;
  consent_given_at: string;
  signature_process_completed_at: string;
};

/** Certificate signature info */
export type SignedSignature = {
  hash: string;
  reason: string;
  certificate: {
    dn: string;
    oid: string;
    hash: string;
    content: string;
    generated_at: string;
  };
};

/** Certificate document info */
export type SignedDocument = {
  id: string;
  name: string;
  mime_type: string;
  signatures: SignedSignature[];
  initial_hash: string;
  initial_storage_id: string;
};

/** Contents of the certificate of a fulfilled signature request */
export type CertificateData = {
  version: number;
  signature_request: SignatureRequest;
  sender: SignedSender;
  signer: SignedSigner;
  documents: SignedDocument[];
  organization: {
    id: string;
    name: string;
  };
  authentication: {
    mode: string; //TODO limit to 'sms' | 'email' if possible
    message: string;
    validated_at: string;
  };
  electronic_signature_level: {
    level: string;
  };
};

/** Metadata stored about a Document on YouSign */
export type DocumentInfo = {
  id: string;
  filename: string;
  nature: "attachment" | "signable_document";
  content_type: string;
  sha256: string;
  is_protected: boolean;
  is_signed: boolean;
  created_at: string;
  total_pages: number;
  is_locked: boolean;
  initials: {
    alignment: "left" | "center" | "right";
    y: number;
  };
  total_anchors: number;
};

//Typegen for Hooks
type CapitalizeFirstLetter<S extends string> =
  S extends `${infer First}${infer Rest}` ? `${Uppercase<First>}${Rest}` : S;

type MethodsOf<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? K : never]: T[K];
};

/**Generates all the onBefore hook type for a givven class/object type */
export type MethodToBeforeEvent<T extends object> = {
  [K in keyof MethodsOf<T> as `onBefore${CapitalizeFirstLetter<K>}`]: (
    //@ts-expect-error
    ...args: Parameters<T[K]>
  ) => void;
};

/** Generates the onAfter hook type for a givven class/object type */
export type MethodToAfterEvent<T extends object> = {
  [K in keyof MethodsOf<T> as `onAfter${CapitalizeFirstLetter<K>}`]: (
    //@ts-expect-error
    data: Awaited<ReturnType<T[K]>>,
  ) => void;
};

/** Generates the types for all the generated Hooks from a class/object type for all the methods/functions in it*/
export type Hooks<T extends object> = MethodToBeforeEvent<T> &
  MethodToAfterEvent<T> & {
    onError: (error?: Error) => void;
  };

/** Options to be passed to the BaseClient or YouSignClient constructor */
export type ClientOptions = {
  environment: "sandbox" | "production";
};
