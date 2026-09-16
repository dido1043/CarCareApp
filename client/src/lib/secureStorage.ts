import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Keychain/Keystore-backed storage for the Supabase session.
 *
 * `SecureStore` warns above 2 KB per entry and a session carrying a JWT plus a
 * refresh token goes past that, so values are split into numbered chunks and a
 * small index entry records how many there are. Web has no SecureStore, and
 * falls back to AsyncStorage — acceptable because the browser build is a
 * development convenience, not a shipped target.
 */

const CHUNK_SIZE = 1536;
const isWeb = Platform.OS === 'web';

const chunkKey = (key: string, index: number): string => `${key}.${index}`;
const countKey = (key: string): string => `${key}.chunks`;

async function readChunkCount(key: string): Promise<number> {
  const raw = await SecureStore.getItemAsync(countKey(key));
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

async function clearChunks(key: string, count: number): Promise<void> {
  const removals: Promise<void>[] = [SecureStore.deleteItemAsync(countKey(key))];
  for (let i = 0; i < count; i += 1) {
    removals.push(SecureStore.deleteItemAsync(chunkKey(key, i)));
  }
  await Promise.all(removals);
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (isWeb) return AsyncStorage.getItem(key);

    const count = await readChunkCount(key);
    if (count === 0) return null;

    const parts = await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i))),
    );

    // A missing chunk means a partial write; treat the whole value as absent.
    return parts.every((part): part is string => part !== null) ? parts.join('') : null;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) return AsyncStorage.setItem(key, value);

    const previousCount = await readChunkCount(key);
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }

    await Promise.all(
      chunks.map((chunk, i) => SecureStore.setItemAsync(chunkKey(key, i), chunk)),
    );
    await SecureStore.setItemAsync(countKey(key), String(chunks.length));

    // Drop chunks left over from a longer previous value.
    for (let i = chunks.length; i < previousCount; i += 1) {
      await SecureStore.deleteItemAsync(chunkKey(key, i));
    }
  },

  async removeItem(key: string): Promise<void> {
    if (isWeb) return AsyncStorage.removeItem(key);
    await clearChunks(key, await readChunkCount(key));
  },
};
