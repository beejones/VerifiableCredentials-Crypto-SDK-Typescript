/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IKeyContainer, KeyType, PrivateKey, CryptographicKey, OctKey, KeyContainer } from 'verifiablecredentials-crypto-sdk-typescript-keys';
import base64url from 'base64url';
import IKeyStore, { KeyStoreListItem } from './IKeyStore';
import KeyStoreOptions from './KeyStoreOptions';

const clone = require('clone');

/**
 * Class defining methods and properties for a light KeyStore
 */
export default class KeyStoreInMemory implements IKeyStore {
  private store: Map<string, IKeyContainer> = new Map<string, IKeyContainer>();

  /**
   * Returns the key container associated with the specified
   * key identifier.
   * @param keyReference for which to return the key.
   * @param [options] Options for retrieving.
   */
  get (keyReference: string, options: KeyStoreOptions = new KeyStoreOptions()): Promise<IKeyContainer> {
    return new Promise((resolve, reject) => {
      if (this.store.has(keyReference)) {
        const key = (<IKeyContainer>this.store.get(keyReference));
        if (key.kty === KeyType.Oct) {
          if (options && options.publicKeyOnly) {
            const error = 'A secret does not has a public key';
            reject(error);
            throw new Error(error);
          }
          return resolve(key);
        }

        if (options && options.publicKeyOnly) {
          switch (key.kty.toLowerCase()) {
            case 'ec':
            case 'okp':
            case 'rsa':
              return resolve(this.publicKeysOnly(key));
            default:
              const error = `A secret does not has a public key`;
              return reject(error);
            }
        } else {
          resolve(key);
        }
      } else {
        const error = `${keyReference} not found`;
        return reject(error);
      }
    });
  }

  private publicKeysOnly(container: IKeyContainer) {
    const publicKeyContainer = clone(container);
    for (let inx = 0; inx < publicKeyContainer.keys.length; inx++) {
      if (publicKeyContainer.keys[inx].getPublicKey) {
        publicKeyContainer.keys[inx] = (<PrivateKey>publicKeyContainer.keys[inx]).getPublicKey();
      }
    }
    return publicKeyContainer;
  }

 /**
  * Lists all keys with their corresponding key ids
  */
  list (_options: KeyStoreOptions = new KeyStoreOptions()): Promise<{ [name: string]: KeyStoreListItem }> {
    const dictionary: { [name: string]: KeyStoreListItem } = {};
    for (let [key, container] of this.store) {
      if ((<any>container)) {
        const keyListInContainer: KeyStoreListItem = {kty: container.kty, kids: []};
        dictionary[key] = keyListInContainer;
        for (let keyInContainer of container.keys) {
          keyListInContainer.kids.push(<string>keyInContainer.kid);
        }
      }
    }
    return new Promise((resolve) => {
      resolve(dictionary);
    });
  }

  /**
   * Saves the specified key to the key store using
   * the key identifier.
   * @param keyIdentifier for the key being saved.
   * @param key being saved to the key store. If the key is a string it will be base64url encoded.
   */
  save (keyIdentifier: string, key: CryptographicKey | string, _options: KeyStoreOptions = new KeyStoreOptions()): Promise<void> {
    //todo serialization of the key needs to happen in here if key is string than create a oct key of it
    console.log(`Store ${keyIdentifier}`);
    if (typeof key === 'string') {
      key = new OctKey(base64url.encode(<string>key));
    }
    if (this.store.get(keyIdentifier)) {
      const container = <IKeyContainer>this.store.get(keyIdentifier);
      container.keys.push(key);
      this.store.set(keyIdentifier, container);
    } else {
      // create new container
      const container = new KeyContainer(key);
      this.store.set(keyIdentifier, container);
    }

    return new Promise((resolve) => {
      resolve();
    });
  }
}
