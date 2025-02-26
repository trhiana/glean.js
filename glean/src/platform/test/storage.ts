/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { StorageIndex } from "../../core/storage/index.js";
import type Store from "../../core/storage/index.js";
import { updateNestedObject, getValueFromNestedObject, deleteKeyFromNestedObject } from "../../core/storage/utils.js";
import type { JSONObject, JSONValue } from "../../core/utils.js";

// Enable storing the data outside of `MockStore` instances to simulate the
// behaviour of the other persistent storages.
let globalStore: JSONObject = {};

/**
 * A weak implementation for the Store interface.
 *
 * This means the data saved in this store does not persist throughout application runs.
 * However, data can be shared across two instances of the store.
 */
class MockStore implements Store {
  private rootKey: string;

  constructor(rootKey: string) {
    this.rootKey = rootKey;
  }

  _getWholeStore(): Promise<JSONObject> {
    const result: JSONObject = (globalStore[this.rootKey] as JSONObject) || {};
    return Promise.resolve(result);
  }

  get(index: StorageIndex): Promise<JSONValue | undefined> {
    try {
      const value = getValueFromNestedObject(globalStore, [ this.rootKey, ...index ]);
      return Promise.resolve(value);
    } catch(e) {
      return Promise.reject(e);
    }
  }

  update(
    index: StorageIndex,
    transformFn: (v?: JSONValue) => JSONValue
  ): Promise<void> {
    try {
      globalStore = updateNestedObject(globalStore, [ this.rootKey, ...index ], transformFn);
      return Promise.resolve();
    } catch(e) {
      return Promise.reject(e);
    }
  }

  delete(index: StorageIndex): Promise<void> {
    try {
      globalStore = deleteKeyFromNestedObject(globalStore, [ this.rootKey, ...index ]);
    } catch (e) {
      console.warn((e as Error).message, "Ignoring.");
    }
    return Promise.resolve();
  }
}
export default MockStore;
