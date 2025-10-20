import type { BaseClient, SignatureRequest, SignatureRequestActivateResponse } from ".";

type DropFirst<T extends any[]> = T extends [infer _, ... infer rest] ? rest : never

function promiseLike<T extends object, V>(instance: T, promise: PromiseLike<V>) {
    return new Proxy(instance, {
      get: (target, prop) => {
        if (prop === 'then') {
          return promise;
        }
        return Reflect.get(target, prop);
      },
      set: (target, prop, value) => {
        return Reflect.set(instance, prop, value);
      }
    }) as T & Promise<V>;
}


/**
 *  ```ts
 * const handle = yousign.createSignatureRequestHandle({
 *      name: signatureName,
 *      delivery_mode: 'email'
 * });
 * 
 * const result = await handle
 *      .addDocument(doc1)
 *      .addSigner(Signer1)
 *      .addSigner(signer2)
 *      .execute()
 * ```
 * All the mutating operations can either be awaited for their individual result, or just chained
 * if intermediate results don't really matter
 * 
 *  ```ts
 *  const handle = yousign.createSignatureRequestHandle({
 * name: signatureName,
 *  delivery_mode: 'email'
 * });
 *
 *  const documentResponse = await handle.addDocument(doc1)
 *
 *  const result = await handle
 *      .addSigner(signer1)
 *      .addSigner(signer2)
 *      .execute()
 * ```
 */
export class SignatureRequestHandle{
    protected _init: SignatureRequest
    protected client:BaseClient
    protected taskList: Promise<unknown>[]
    protected taskErrors: Error[]

    constructor(client: BaseClient, request: SignatureRequest){
        this.client = client;
        this._init = request;
    }

    get id() {
        return this._init.id
    }

/**
   * Adds a document to the signature request
   * @param options document options
   * @returns The instance of the SignatureRequestHandle, or if awaited, the result of the addDocument operation
   */
    addDocument(...args: DropFirst<Parameters<typeof this.client.addDocument>>){
        const promise = this.client.addDocument(this.id, ...args)
        this._executeAsTask("addDocument",promise)
        return promiseLike(this, promise)
    }

  /**
   * Adds Metadata to the signature request
   * @param metadata 
   * @returns The instance of the SignatureRequestHandle, or if awaited, the result of the addSignatureRequestMetadata operation
   */
    addSignatureRequestMetadata(...args: DropFirst<Parameters<typeof this.client.addSignatureRequestMetadata>>){
        const promise = this.client.addSignatureRequestMetadata(this.id, ...args);
        this._executeAsTask("addSignatureRequestMetadata", promise)
        return promiseLike(this, promise)
    }

  /**
   * Adds a person that needs to sign the document to the signature request
   * @param options
   * @returns The instance of the SignatureRequestHandle, or if awaited, the result of the addSigner operation
   */
    addSigner(...args: DropFirst<Parameters<typeof this.client.addSigner>>){
        const promise = this.client.addSigner(this.id, ...args)
        this._executeAsTask("addSigner", promise)
        return promiseLike(this, promise)
    }

  /**
   * Adds a Signer Consent Request to the SignatureRequestHandle
   * @param signerIds 
   * @param documentId 
   * @param options 
   * @returns The instance of the SignatureRequestHandle, or if awaited, the result of the addSignerConsent operation
   */
    addSignerConsent(...args: DropFirst<Parameters<typeof this.client.addSignerConsent>>){
        const promise = this.client.addSignerConsent(this.id, ...args)
        this._executeAsTask("addSignerConsent", promise)
        return promiseLike(this, promise)
    }

    /**
     * Waits for the execution of all the adding operations, returns errors or the activation message if successfull
     */
    async execute(): Promise<SignatureRequestActivateResponse|Error[]> {
        await Promise.allSettled(this.taskList);
        if(this.taskErrors.length === 0){
            try {
                const result = await this.client.activateSignatureRequest(this.id)
                this.taskErrors = []
                return result
            }catch(e){
                this.taskErrors = []
                return [new Error("Error while activating the signature request", {cause: e})]
            }
        }
        const errors = this.taskErrors
        this.taskErrors = []
        return errors
    }

    protected _executeAsTask(name: string, promise: Promise<unknown>){
        this.taskList.push(promise)

        promise.then(() => {
            const index = this.taskList.indexOf(promise);
            this.taskList.splice(index, 1);
        })

        promise.catch((e) => {
            const index = this.taskList.indexOf(promise);
            this.taskList.splice(index, 1);
            this.taskErrors.push(new Error(`Error on ${name}`, {cause: e}))
        })
    }
}







