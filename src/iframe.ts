enum EventTypes {
  STARTED = "started",
  SUCCESS = "success",
  ERROR = "error",
  PING = "ping",
  DECLINED = "declined",
}

class InvalidSignatureLink extends Error {
  constructor() {
    super("The signature link is invalid.");
    this.name = "InvalidSignatureLink";
  }
}

class IframeContainerNotFound extends Error {
  constructor(containerId: string) {
    super(`The iFrame container with the id "${containerId}" is not found.`);
    this.name = "IframeContainerNotFound";
  }
}

class InvalidCallbackFunction extends Error {
  constructor(event: EventTypes) {
    super(`Callback on ${event} event is not a function.`);
    this.name = "InvalidCallbackFunction";
  }
}

interface YousignConfig {
  /**
   * The URL of the signature request.
   */
  signatureLink: string;
  /** The id attribute of the element where the iframe is initialized. */
  iframeContainerId: string;
  /** To set if you want to test your integration with sandbox environment */
  isSandbox?: boolean;
  /** Classes to add to the iframe component once it loaded */
  classes?: string[];
}

type YousignRadio = {
  /** The radio button ID. */
  id: string;
  /** Determines if the radio button field on the signature was checked. */
  checked: boolean;
  /** Name of the radio button */
  name: string;
  /** Name of the radio button */
  x: number;
  /** Name of the radio button */
  y: number;
};

type YousignCheckboxAnswer = {
  /** Field ID. */
  field_id: string;
  field_type: "checkbox";
  /** Determines if the checkbox field on the signature was checked. */
  checked: boolean;
  /** Determines if the checkbox field on the signature was optional. */
  optional: boolean;
};

type YousignTextAnswer = {
  /** Field ID. */
  field_id: string;
  field_type: "text";
  /** The question in the text field on the signature. */
  question: string;
  /** The answer of the question text field on the signature. */
  answer: string;
};

type YousignRadioGroupAnser = {
  /** Field ID. */
  field_id: string;
  /** The field type, see {@link https://developers.yousign.com/docs/signer-fields|signer fields} for more information about fields). */
  field_type: "radio_group";
  /** Determines if the radio group field on the signature was optional. */
  optional: boolean;
  /** List of the radio button attached to the radio group. */
  radios: YousignRadio[];
};

type YousignAnswer =
  | YousignTextAnswer
  | YousignCheckboxAnswer
  | YousignRadioGroupAnser;

type YousignBaseEvent = {
  /**Always equal to yousign */
  type: string;
  /**The signer ID. */
  signer_id: string;
  /** The signature request ID   */
  signature_request_id: string;

  payload?: {
    redirectUrl?: string;
  };
};

type YousignSuccessEvent = YousignBaseEvent & {
  event: "success";
  answers: YousignAnswer[];
};

type YousignErrorEvent = YousignBaseEvent & {
  event: "error";
  answers: YousignAnswer[];
};

type YousignStartedEvent = YousignBaseEvent & {
  event: "started";
};

type YousignDeclinedEvent = YousignBaseEvent & {
  event: "declined";
};

type YousignPingEvent = YousignBaseEvent & {
  event: "ping";
};

export type YousignEvent =
  | YousignSuccessEvent
  | YousignErrorEvent
  | YousignStartedEvent
  | YousignDeclinedEvent
  | YousignPingEvent;
type EventCallback<T extends YousignEvent["event"] = any> = (
  data: T extends YousignEvent["event"]
    ? Extract<YousignEvent, { event: T }>
    : YousignEvent,
) => void;

/**
 * For security reasons, iFrame is available only in production on whitelisted domains. To add your domains, please get in touch with our support.
 * @example ````ts

 ```
 */
export class Yousign {
  private childOrigin: RegExp;
  private eventCallbacks: { [key in EventTypes]?: EventCallback };
  private iframe: HTMLIFrameElement;
  private messageHandler: (event: MessageEvent) => void;
  private urlParams: URLSearchParams;

  /**
   * @param {YouSignConfig} config
   * @throws {InvalidSignatureLink} The signature link is not an URL or not valid.
   * @throws {IframeContainerNotFound} The Iframe container is not found
   */
  constructor({
    signatureLink,
    iframeContainerId,
    isSandbox = false,
    classes = [],
  }: YousignConfig) {
    this.childOrigin = /^https:\/\/yousign.app$/;
    this.eventCallbacks = {};

    let url: URL;
    try {
      url = new URL(signatureLink);
    } catch {
      throw new InvalidSignatureLink();
    }

    const container = document.getElementById(iframeContainerId);
    console.log(container);
    if (!container) {
      throw new IframeContainerNotFound(iframeContainerId);
    }

    if (isSandbox) {
      url.searchParams.append("disable_domain_validation", "true");
    }

    this.urlParams = new Proxy(url.searchParams, {
      get: (params, prop: string) => params.get(prop),
    }) as URLSearchParams;

    this.iframe = document.getElementById(
      "yousign-iframe",
    ) as HTMLIFrameElement;
    if (!this.iframe) {
      this.iframe = document.createElement("iframe");
      this.iframe.id = "yousign-iframe";
      this.iframe.classList.add(...classes);
      container.appendChild(this.iframe);
    }
    this.iframe.src = url.href;

    this.messageHandler = this.receiveMessage.bind(this);
    window.addEventListener("message", this.messageHandler, false);
  }

  private receiveMessage(event: MessageEvent<YousignEvent>) {
    const { origin, data } = event;
    if (typeof data !== "object" || !data.type) {
      return;
    }

    if (origin.match(this.childOrigin) && data.type === "yousign") {
      const callback = this.eventCallbacks[data.event];
      if (callback && typeof callback === "function") {
        callback(data);
      }
    } else if (data.type === "__ubble" && data.payload?.redirectUrl) {
      this.iframe.src = `${
        data.payload.redirectUrl
      }&k=${this.urlParams.get("k")}`;
    }
  }

  /**
   * A function that is triggered when the signature is opened.
   * @throws {InvalidCallbackFunction} Callback on event is not a function
   */
  public onStarted(callback: EventCallback<"started">) {
    this.setEventCallback(EventTypes.STARTED, callback);
  }

  /**
   * A function that is triggered when the signature is signed successfully.
   * @throws {InvalidCallbackFunction} Callback on event is not a function
   */
  public onSuccess(callback: EventCallback<"success">) {
    this.setEventCallback(EventTypes.SUCCESS, callback);
  }

  /**
   * A function that is triggered when the signature encountered an error when signing.
   * @throws {InvalidCallbackFunction} Callback on event is not a function
   */
  public onError(callback: EventCallback<"error">) {
    this.setEventCallback(EventTypes.ERROR, callback);
  }

  /**
   * A function that is triggered every 5 seconds to inform the signature request is loaded.
   * @throws {InvalidCallbackFunction} Callback on event is not a function
   */
  public onPing(callback: EventCallback<"ping">) {
    this.setEventCallback(EventTypes.PING, callback);
  }

  /**
   * A function that is triggered when the signer declined the signature.
   * @throws {InvalidCallbackFunction} Callback on event is not a function
   */
  public onDeclined(callback: EventCallback<"declined">) {
    this.setEventCallback(EventTypes.DECLINED, callback);
  }

  /**
   * @throws {InvalidCallbackFunction} Callback on event is not a function
   */
  private setEventCallback(eventType: EventTypes, callback: EventCallback) {
    if (typeof callback !== "function") {
      throw new InvalidCallbackFunction(eventType);
    }
    this.eventCallbacks[eventType] = callback;
  }

  public removeMessageListener() {
    window.removeEventListener("message", this.messageHandler);
  }
}

const yousign = new Yousign({
  signatureLink: "signature_link",
  iframeContainerId: "iframe-container",
  isSandbox: false,
  classes: ["h-full", "w-full"],
});

yousign.onStarted((data) => {
  console.log("Signer has opened the signature");
  console.log(data);
});

yousign.onSuccess((data) => {
  console.log("Signer has successfully signed");
  console.log(data);
});

yousign.onError((data) => {
  console.log("Signer encountered an error when signing");
  console.log(data);
});

yousign.onPing((data) => {
  console.log("Ping - The signature request is loaded");
  console.log(data);
});

yousign.onDeclined((data) => {
  console.log("Declined - The signer declined the signature");
  console.log(data);
});
