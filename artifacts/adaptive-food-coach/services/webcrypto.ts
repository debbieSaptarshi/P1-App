import * as ExpoCrypto from 'expo-crypto';

function toBytes(data: BufferSource) {
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

function installWebCrypto() {
  const digest = (algorithm: AlgorithmIdentifier, data: BufferSource) => {
    const name = (typeof algorithm === 'string' ? algorithm : algorithm.name).toUpperCase();
    if (name !== 'SHA-256') return Promise.reject(new Error(`Unsupported digest: ${name}`));
    return ExpoCrypto.digest(ExpoCrypto.CryptoDigestAlgorithm.SHA256, toBytes(data));
  };

  const current = globalThis.crypto;
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      ...current,
      getRandomValues: ExpoCrypto.getRandomValues.bind(ExpoCrypto),
      randomUUID: ExpoCrypto.randomUUID.bind(ExpoCrypto),
      subtle: { ...(current?.subtle ?? {}), digest },
    },
  });
}

installWebCrypto();
