/**
 * CertificateViewerScreen
 *
 * In-app viewer for certificates. Supports:
 *   • Images — rendered with react-native Image (pan + zoom via ScrollView)
 *   • PDFs   — rendered with react-native-pdf (native renderer, no WebView)
 *
 * Navigation param: { fileUrl: string; fileName?: string }
 *
 * Dependencies:
 *   react-native-pdf         ← npm install react-native-pdf  (+ pod install on iOS)
 *   react-native-blob-util   ← already in package.json (also a peer dep of rn-pdf)
 */

import React, {useState} from 'react';
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
  Linking,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import ReactNativeBlobUtil from 'react-native-blob-util';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '../theme';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

function isPdf(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase().split('?')[0];
  return lower.endsWith('.pdf') || lower.includes('/pdf');
}

function isImage(url: string): boolean {
  if (!url) return false;
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
  // Android 10+ (API 29+): DownloadManager has system-level access to the
  // public Downloads folder — WRITE_EXTERNAL_STORAGE is not needed.
  if ((Platform.Version as number) >= 29) return true;
  // Android 9 and below: need the permission explicitly.
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

  // PDF state
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfTotal, setPdfTotal] = useState(0);

  // Download state
  const [downloading, setDownloading] = useState(false);

  const type = isPdf(fileUrl) ? 'pdf' : isImage(fileUrl) ? 'image' : 'unknown';

  // ── Download ──────────────────────────────────────────────────────────────
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
      const safeName =
        (fileName || 'certificate').replace(/[^a-zA-Z0-9_\-\.]/g, '_') + ext;
      const mime = type === 'pdf' ? 'application/pdf' : 'image/jpeg';

      if (Platform.OS === 'android') {
        const subfolder = 'Activity Point Certificates';
        const downloadDir = ReactNativeBlobUtil.fs.dirs.DownloadDir;
        const folderPath = `${downloadDir}/${subfolder}`;
        const destPath = `${folderPath}/${safeName}`;

        // On Android 10+ the DownloadManager creates the subfolder for us.
        // On Android 9 and below we need to mkdir ourselves.
        if ((Platform.Version as number) < 29) {
          const exists = await ReactNativeBlobUtil.fs.isDir(folderPath);
          if (!exists) {
            await ReactNativeBlobUtil.fs.mkdir(folderPath);
          }
        }

        await ReactNativeBlobUtil.config({
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            title: safeName,
            description: 'Activity Point Certificate',
            mime,
            path: destPath,
            mediaScannable: true,
          },
        }).fetch('GET', fileUrl);

        Alert.alert(
          'Downloaded ✓',
          `Saved to:\nDownloads › Activity Point Certificates › ${safeName}`,
        );
      } else {
        // iOS — save to Documents (accessible via Files app)
        const folderPath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/Activity Point Certificates`;
        const destPath = `${folderPath}/${safeName}`;
        const exists = await ReactNativeBlobUtil.fs.isDir(folderPath);
        if (!exists) {
          await ReactNativeBlobUtil.fs.mkdir(folderPath);
        }
        await ReactNativeBlobUtil.config({path: destPath}).fetch('GET', fileUrl);
        Alert.alert(
          'Downloaded ✓',
          `Saved to Files › Activity Point Certificates › ${safeName}`,
        );
      }
    } catch (err: any) {
      Alert.alert('Download failed', err?.message || 'Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, {backgroundColor: colors.bg}]} edges={['top']}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {backgroundColor: colors.card, borderBottomColor: colors.border},
        ]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, {color: colors.text}]} numberOfLines={1}>
            {fileName || 'Certificate'}
          </Text>
          {type === 'pdf' && pdfLoaded && pdfTotal > 0 && (
            <Text style={[styles.pageCounter, {color: colors.textMuted}]}>
              {pdfPage} / {pdfTotal}
            </Text>
          )}
        </View>

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
          <MaterialCommunityIcons
            name="file-alert-outline"
            size={60}
            color={colors.textMuted}
          />
          <Text style={[styles.errText, {color: colors.textMuted}]}>
            No file URL provided.
          </Text>
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
        /* ── PDF viewer — react-native-pdf (native renderer, no WebView) ── */
        <View style={styles.pdfContainer}>
          {/* Loading overlay — hidden once PDF is ready */}
          {!pdfLoaded && !pdfError && (
            <View
              style={[
                styles.center,
                StyleSheet.absoluteFill,
                {backgroundColor: colors.bg},
              ]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, {color: colors.textMuted}]}>
                Loading PDF…
              </Text>
            </View>
          )}

          {/* Error state */}
          {pdfError && (
            <View style={[styles.center, {flex: 1, backgroundColor: colors.bg}]}>
              <MaterialCommunityIcons name="file-pdf-box" size={60} color="#ef4444" />
              <Text style={[styles.errText, {color: colors.textMuted}]}>
                Could not display this PDF.
              </Text>
              <Text style={[styles.errSub, {color: colors.textMuted}]}>
                Try downloading it or open it in your browser.
              </Text>
              <TouchableOpacity
                style={[styles.openBrowserBtn, {backgroundColor: colors.primary}]}
                onPress={() => Linking.openURL(fileUrl)}>
                <MaterialCommunityIcons name="open-in-new" size={18} color="#fff" />
                <Text style={styles.openBrowserText}>Open in Browser</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* The Pdf component uses Android PdfRenderer / iOS CGPDFDocument natively.
              It downloads to cache internally so there is no WebView download trigger. */}
          {!pdfError && (
            <Pdf
              source={{uri: fileUrl, cache: true}}
              style={[styles.pdf, !pdfLoaded && styles.hidden]}
              onLoadComplete={(pages, _path) => {
                setPdfTotal(pages);
                setPdfLoaded(true);
              }}
              onPageChanged={(page, _pages) => setPdfPage(page)}
              onError={(_error) => {
                setPdfError(true);
                setPdfLoaded(true);
              }}
              enablePaging={false}
              horizontal={false}
              enableAntialiasing
              trustAllCerts={false}
            />
          )}
        </View>
      ) : (
        /* ── Unknown type — attempt to display as image ── */
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
              Alert.alert(
                'Unsupported format',
                'Cannot preview this file type. Try downloading it.',
              )
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
  headerCenter: {flex: 1},
  headerTitle: {fontSize: 16, fontWeight: '700'},
  pageCounter: {fontSize: 11, marginTop: 2},
  downloadBtn: {padding: 8, borderRadius: 10},
  pdfContainer: {flex: 1},
  pdf: {
    flex: 1,
    width: SCREEN_W,
  },
  hidden: {opacity: 0},
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
  openBrowserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  openBrowserText: {color: '#fff', fontSize: 14, fontWeight: '600'},
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
