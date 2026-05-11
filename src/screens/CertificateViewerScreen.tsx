/**
 * CertificateViewerScreen
 *
 * In-app viewer for certificates. Supports:
 *   • Images  — rendered with react-native Image (pan + zoom via ScrollView)
 *   • PDFs    — rendered with react-native-webview (loads PDF URL inside WebView)
 *
 * Navigation param: { fileUrl: string; fileName?: string }
 *
 * Dependencies already in package.json:
 *   react-native-webview        ← add to package.json if not present
 *   react-native-blob-util      ← for download
 */

import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  ScrollView,
  Image,
  PermissionsAndroid,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WebView} from 'react-native-webview';
import ReactNativeBlobUtil from 'react-native-blob-util';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '../theme';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

function isPdf(url: string): boolean {
  const lower = url.toLowerCase().split('?')[0];
  return lower.endsWith('.pdf') || lower.includes('/pdf');
}

function isImage(url: string): boolean {
  const lower = url.toLowerCase().split('?')[0];
  return (
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.bmp')
  );
}

async function requestAndroidStorage(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  // Android 13+ (API 33) no longer needs WRITE_EXTERNAL_STORAGE for Downloads
  if (Platform.Version >= 33) return true;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    {
      title: 'Storage Permission',
      message: 'Needed to save the certificate to your Downloads folder.',
      buttonPositive: 'Allow',
    },
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export default function CertificateViewerScreen({route, navigation}: any) {
  const {colors} = useTheme();
  const {fileUrl, fileName = 'certificate'} = route.params ?? {};

  const [webViewLoaded, setWebViewLoaded] = useState(false);
  const [webViewError, setWebViewError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const type = isPdf(fileUrl) ? 'pdf' : isImage(fileUrl) ? 'image' : 'unknown';

  // ── Download ─────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (downloading) return;
    const ok = await requestAndroidStorage();
    if (!ok) {
      Alert.alert('Permission denied', 'Storage permission is required to download files.');
      return;
    }
    setDownloading(true);
    try {
      const ext = type === 'pdf' ? '.pdf' : type === 'image' ? '.jpg' : '';
      const safeName = (fileName || 'certificate').replace(/[^a-zA-Z0-9_\-\.]/g, '_') + ext;
      const mime = type === 'pdf' ? 'application/pdf' : 'image/jpeg';

      if (Platform.OS === 'android') {
        const folderPath = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/Activity Point Certificates`;

        // Create the subfolder if it doesn't exist yet
        const folderExists = await ReactNativeBlobUtil.fs.isDir(folderPath);
        if (!folderExists) {
          await ReactNativeBlobUtil.fs.mkdir(folderPath);
        }

        const destPath = `${folderPath}/${safeName}`;

        await ReactNativeBlobUtil.config({
          path: destPath,           // no fileCache:true — that overrides path and sends to cache
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            title: safeName,
            description: 'Activity Point Certificate',
            mime,
            mediaScannable: true,   // makes file appear in Files app immediately
            path: destPath,         // Download Manager also needs path here
          },
        }).fetch('GET', fileUrl);

        Alert.alert(
          'Downloaded ✓',
          `Saved to:\nDownloads › Activity Point Certificates › ${safeName}`,
        );
      } else {
        // iOS — save to Documents
        const destPath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/Activity Point Certificates/${safeName}`;
        const folderPath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/Activity Point Certificates`;
        const folderExists = await ReactNativeBlobUtil.fs.isDir(folderPath);
        if (!folderExists) {
          await ReactNativeBlobUtil.fs.mkdir(folderPath);
        }
        await ReactNativeBlobUtil.config({path: destPath}).fetch('GET', fileUrl);
        Alert.alert('Downloaded ✓', `Saved to Files › Activity Point Certificates › ${safeName}`);
      }
    } catch (err: any) {
      Alert.alert('Download failed', err?.message || 'Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // ── PDF via WebView (Google Docs viewer fallback for wide compatibility) ──
  // ImageKit PDFs are served over https, so WebView can load them directly.
  // On older Androids that can't render PDFs natively in WebView, we proxy
  // through Google Docs viewer.
  const pdfSrc =
    Platform.OS === 'android'
      ? {uri: `https://docs.google.com/gviewer?embedded=true&url=${encodeURIComponent(fileUrl)}`}
      : {uri: fileUrl};

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, {backgroundColor: colors.bg}]} edges={['top']}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />

      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.text}]} numberOfLines={1}>
          {fileName || 'Certificate'}
        </Text>
        <TouchableOpacity
          style={[
            styles.downloadBtn,
            {backgroundColor: colors.primaryMuted},
            downloading && {opacity: 0.5},
          ]}
          onPress={handleDownload}
          disabled={downloading}>
          {downloading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MaterialCommunityIcons name="download" size={22} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Body */}
      {!fileUrl ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="file-alert-outline" size={60} color={colors.textMuted} />
          <Text style={[styles.errText, {color: colors.textMuted}]}>No file URL provided.</Text>
        </View>
      ) : type === 'image' ? (
        /* ── Image viewer ── */
        <ScrollView
          style={{flex: 1, backgroundColor: '#000'}}
          contentContainerStyle={styles.imageScrollContent}
          maximumZoomScale={4}
          minimumZoomScale={1}
          bouncesZoom
          centerContent>
          <Image
            source={{uri: fileUrl}}
            style={styles.fullImage}
            resizeMode="contain"
            onError={() => Alert.alert('Error', 'Could not load image.')}
          />
        </ScrollView>
      ) : type === 'pdf' ? (
        /* ── PDF viewer ── */
        <View style={{flex: 1}}>
          {!webViewLoaded && !webViewError && (
            <View style={[styles.center, StyleSheet.absoluteFill, {backgroundColor: colors.bg}]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, {color: colors.textMuted}]}>Loading PDF…</Text>
            </View>
          )}
          {webViewError && (
            <View style={[styles.center, {backgroundColor: colors.bg, flex: 1}]}>
              <MaterialCommunityIcons name="file-pdf-box" size={60} color="#ef4444" />
              <Text style={[styles.errText, {color: colors.textMuted}]}>
                Could not display PDF inline.
              </Text>
              <Text style={[styles.errSub, {color: colors.textMuted}]}>
                Try downloading it instead.
              </Text>
            </View>
          )}
          <WebView
            source={pdfSrc}
            style={[styles.webView, webViewError && {opacity: 0}]}
            onLoadEnd={() => setWebViewLoaded(true)}
            onError={() => {setWebViewError(true); setWebViewLoaded(true);}}
            onHttpError={() => {setWebViewError(true); setWebViewLoaded(true);}}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            originWhitelist={['*']}
            mixedContentMode="always"
          />
        </View>
      ) : (
        /* ── Unknown type — try as image first ── */
        <ScrollView
          style={{flex: 1, backgroundColor: '#000'}}
          contentContainerStyle={styles.imageScrollContent}
          maximumZoomScale={4}
          minimumZoomScale={1}
          bouncesZoom
          centerContent>
          <Image
            source={{uri: fileUrl}}
            style={styles.fullImage}
            resizeMode="contain"
            onError={() =>
              Alert.alert('Unsupported format', 'Cannot preview this file type. Try downloading it.')
            }
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: {padding: 6},
  headerTitle: {flex: 1, fontSize: 16, fontWeight: '700'},
  downloadBtn: {padding: 8, borderRadius: 10},
  webView: {flex: 1},
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  loadingText: {marginTop: 10, fontSize: 14},
  errText: {fontSize: 15, fontWeight: '600', textAlign: 'center'},
  errSub: {fontSize: 13, textAlign: 'center', marginTop: 4},
  imageScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SCREEN_H - 120,
  },
  fullImage: {
    width: SCREEN_W,
    height: SCREEN_H - 120,
  },
});
