import { Linking, Platform, Share } from 'react-native';
import type { RefObject } from 'react';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef, type ViewShotRef } from 'react-native-view-shot';

export async function captureShareCard(
  ref: RefObject<ViewShotRef | null>,
): Promise<string | null> {
  if (!ref.current) return null;
  try {
    if (typeof ref.current.capture === 'function') {
      const uri = await ref.current.capture();
      return uri || null;
    }
    const uri = await captureRef(ref, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });
    return typeof uri === 'string' && uri.length > 0 ? uri : null;
  } catch {
    return null;
  }
}

export async function copyCaption(caption: string) {
  await Clipboard.setStringAsync(caption);
}

export async function saveImageToLibrary(uri: string) {
  if (Platform.OS === 'web') {
    throw new Error('Saving to the camera roll is not available on web.');
  }
  const permission = await MediaLibrary.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission is required to save this card.');
  }
  await MediaLibrary.saveToLibraryAsync(uri);
}

export async function openMessages(caption: string) {
  const body = encodeURIComponent(caption);
  const url = Platform.OS === 'android' ? `sms:?body=${body}` : `sms:&body=${body}`;
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error('Messages is not available on this device.');
  }
  await Linking.openURL(url);
}

export async function openInstagramOrShare(caption: string, imageUri: string | null) {
  const candidates = ['instagram://app', 'instagram://camera', 'instagram://share'];
  for (const url of candidates) {
    try {
      if (await Linking.canOpenURL(url)) {
        await Clipboard.setStringAsync(caption);
        await Linking.openURL(url);
        return 'instagram' as const;
      }
    } catch {
      // try the next scheme
    }
  }
  await systemShare(caption, imageUri);
  return 'share' as const;
}

export async function systemShare(caption: string, imageUri: string | null) {
  if (Platform.OS === 'ios') {
    await Share.share(
      imageUri
        ? { message: caption, url: imageUri }
        : { message: caption },
    );
    return;
  }

  if (imageUri && (await Sharing.isAvailableAsync())) {
    await Clipboard.setStringAsync(caption);
    await Sharing.shareAsync(imageUri, {
      mimeType: 'image/png',
      dialogTitle: caption,
      UTI: 'public.png',
    });
    return;
  }

  await Share.share({ message: caption });
}
