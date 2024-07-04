function capitalizeFirst(input: string) {
  return input.charAt(0).toUpperCase() + input.slice(1);
}

export function noHook(target: any, context: ClassMethodDecoratorContext<any>) {
  if (!target.constructor.prototype.__skipLog__) {
    target.constructor.prototype.__skipLog__ = [];
  }
  target.constructor.prototype.__skipLog__.push(context);
}

export function GenHooks(target: any) {
  const originalMethod = target.prototype.constructor;
  let proto = originalMethod.prototype;
  while (proto !== null) {
    // Iterate over each method in the prototype
    Object.getOwnPropertyNames(proto).forEach((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(proto, key);

      // Apply logging to methods unless excluded
      if (
        descriptor &&
        descriptor.value instanceof Function &&
        !proto.__skipLog__?.includes(key)
      ) {
        const originalFn = descriptor.value;

        descriptor.value = async function (...args: any[]) {
          if (!this.hooks) {
            throw new Error(
              "You need to initialize hooks with Event<HookBaseCass> before using it"
            );
          }

          const hookBaseName = capitalizeFirst(key);

          this.hooks.callHook(`onBegin${hookBaseName}`, ...args);

          const result = await originalFn.apply(this, args);

          this.hooks.callHook(`onAfter${hookBaseName}`, ...args);

          return result;
        };

        Object.defineProperty(originalMethod.prototype, key, descriptor);
      }
    });

    proto = Object.getPrototypeOf(proto);
  }
}
