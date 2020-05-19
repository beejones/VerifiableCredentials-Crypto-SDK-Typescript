/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IKeyStore } from '@microsoft/crypto-keystore';
import CryptoFactory, { CryptoFactoryScope } from './CryptoFactory';
import { SubtleCryptoElliptic } from '@microsoft/crypto-subtle-plugin-elliptic';
import { SubtleCrypto } from './index';

/**
 * Utility class to handle all CryptoFactory dependency injection for the environment node.
 * In the same way a developer can add new CryptoFactory classes that support a different device.
 */
export default class CryptoFactoryNode extends CryptoFactory {

  /**
   * Constructs a new CryptoFactoryNode
   * @param keyStore used to store private keys
   * @param crypto Default subtle crypto used for e.g. hashing.
   */
  constructor (keyStore: IKeyStore, crypto: any) {
    super(keyStore, crypto);
    const subtleCrypto: any = new SubtleCryptoElliptic(crypto);
    this.addMessageSigner('EdDSA', {subtleCrypto, scope: CryptoFactoryScope.All});
    this.addMessageSigner('EDDSA', {subtleCrypto, scope: CryptoFactoryScope.All});
    this.addMessageSigner('ed25519', {subtleCrypto, scope: CryptoFactoryScope.All});
  }
}
