import React, {useState, useEffect} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import axiosInstance from '../api/axiosInstance';

const MAX_FILE_SIZE_MB = 5; // slightly more lenient on mobile

function buildSearchIndex(categories: any[]) {
  const items: any[] = [];
  categories.forEach(cat => {
    (cat.subcategories || []).forEach((sub: any) => {
      items.push({
        categoryId: cat._id,
        categoryName: cat.name,
        subcategoryName: sub.name,
        sub,
      });
    });
  });
  return items;
}

export default function UploadCertificateScreen({navigation}: any) {
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [subcategoryName, setSubcategoryName] = useState('');
  const [levelSelected, setLevelSelected] = useState('');
  const [prizeType, setPrizeType] = useState('');
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [eligiblePoints, setEligiblePoints] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [eventName, setEventName] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [isOthers, setIsOthers] = useState(false);
  const [othersDescription, setOthersDescription] = useState('');

  // Category/subcategory dropdowns
  const [catOpen, setCatOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [levelOpen, setLevelOpen] = useState(false);
  const [prizeOpen, setPrizeOpen] = useState(false);

  useEffect(() => {
    axiosInstance
      .get('/categories')
      .then(res => setCategories(res.data.categories || []))
      .catch(() => Alert.alert('Error', 'Failed to fetch categories'));
  }, []);

  // Update subcategories on category change
  useEffect(() => {
    if (!categoryId) {
      setSubcategories([]);
      setSubcategoryName('');
      setLevelSelected('');
      setPrizeType('');
      setEligiblePoints(null);
      return;
    }
    const cat = categories.find(c => c._id === categoryId);
    setSubcategories(cat?.subcategories || []);
    setSubcategoryName('');
    setLevelSelected('');
    setPrizeType('');
    setEligiblePoints(null);
  }, [categoryId, categories]);

  // Update eligible points
  useEffect(() => {
    if (!categoryId || !subcategoryName) {
      setEligiblePoints(null);
      return;
    }
    const cat = categories.find(c => c._id === categoryId);
    const sub = cat?.subcategories?.find((s: any) => s.name === subcategoryName);
    if (!sub) return setEligiblePoints(null);
    if (sub.fixedPoints != null) {
      setEligiblePoints(sub.fixedPoints);
    } else if (sub.levels?.length) {
      if (!levelSelected || !prizeType) return setEligiblePoints(null);
      const levelObj = sub.levels.find((l: any) => l.name === levelSelected);
      const prizeObj = levelObj?.prizes?.find((p: any) => p.type === prizeType);
      setEligiblePoints(prizeObj?.points ?? null);
    } else {
      setEligiblePoints(null);
    }
  }, [categoryId, subcategoryName, levelSelected, prizeType, categories]);

  // Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const idx = buildSearchIndex(categories);
    const q = searchQuery.toLowerCase();
    const results = idx
      .filter(
        item =>
          item.subcategoryName.toLowerCase().includes(q) ||
          item.categoryName.toLowerCase().includes(q),
      )
      .slice(0, 10);
    setSearchResults(results);
    setShowDropdown(true);
  }, [searchQuery, categories]);

  const selectSearchResult = (item: any) => {
    const cat = categories.find(c => c._id === item.categoryId);
    setCategoryId(item.categoryId);
    setSubcategories(cat?.subcategories || []);
    setSubcategoryName(item.subcategoryName);
    setLevelSelected('');
    setPrizeType('');
    setSearchQuery('');
    setShowDropdown(false);
    setIsOthers(false);
    setOthersDescription('');
  };

  const activateOthers = () => {
    setCategoryId('');
    setSubcategoryName('');
    setSubcategories([]);
    setLevelSelected('');
    setPrizeType('');
    setEligiblePoints(null);
    setSearchQuery('');
    setShowDropdown(false);
    setIsOthers(true);
    setOthersDescription('');
  };

  const handlePickFile = async () => {
    const result = await launchImageLibrary({
      mediaType: 'mixed',
      quality: 0.8,
      selectionLimit: 1,
    });
    if (result.didCancel || !result.assets?.length) return;
    const asset = result.assets[0];
    if ((asset.fileSize || 0) > MAX_FILE_SIZE_MB * 1024 * 1024) {
      Alert.alert('Error', `File must be under ${MAX_FILE_SIZE_MB} MB`);
      return;
    }
    setUploadedFile(asset);
  };

  const currentSub =
    !isOthers && subcategoryName
      ? subcategories.find(s => s.name === subcategoryName)
      : null;
  const hasLevels = currentSub?.levels?.length > 0;

  const canSubmit = isOthers
    ? othersDescription.trim() && uploadedFile && !uploading
    : categoryId && subcategoryName && uploadedFile && !uploading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setUploading(true);
    try {
      const formData = new FormData();
      if (isOthers) {
        formData.append('categoryId', 'others');
        formData.append('subcategoryName', othersDescription.trim());
        formData.append('level', '');
        formData.append('prizeType', '');
      } else {
        formData.append('categoryId', categoryId);
        formData.append('subcategoryName', subcategoryName);
        formData.append('level', levelSelected || '');
        formData.append('prizeType', prizeType || '');
      }
      if (dateFrom) formData.append('dateFrom', dateFrom);
      if (dateTo) formData.append('dateTo', dateTo);
      if (eventName.trim()) formData.append('eventName', eventName.trim());

      // Attach file
      const file = uploadedFile;
      formData.append('file', {
        uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
        type: file.type || 'image/jpeg',
        name: file.fileName || 'certificate.jpg',
      } as any);

      await axiosInstance.post('/certificates/upload', formData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });

      setSubmitted(true);
    } catch (err) {
      Alert.alert('Upload Failed', 'Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successEmoji}>✅</Text>
        <Text style={styles.successTitle}>Certificate Submitted!</Text>
        <Text style={styles.successSub}>
          Your certificate has been submitted and is pending approval by your tutor.
        </Text>
        <TouchableOpacity
          style={styles.successBtn}
          onPress={() => {
            setSubmitted(false);
            navigation.navigate('Dashboard');
          }}>
          <Text style={styles.successBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedCat = categories.find(c => c._id === categoryId);
  const prizeLevels = ['Participation', 'First', 'Second', 'Third'];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>Upload Certificate</Text>

      {/* Search */}
      <Text style={styles.label}>Search Certificate Type</Text>
      <TextInput
        style={styles.input}
        placeholder="Search by name, category…"
        placeholderTextColor="#9ca3af"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {showDropdown && (
        <View style={styles.dropdown}>
          {searchResults.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.dropdownItem}
              onPress={() => selectSearchResult(item)}>
              <Text style={styles.dropdownMain}>{item.subcategoryName}</Text>
              <Text style={styles.dropdownSub}>{item.categoryName}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.dropdownItem} onPress={activateOthers}>
            <Text style={styles.dropdownMain}>Others</Text>
            <Text style={styles.dropdownSub}>Certificate not listed above</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Others mode */}
      {isOthers ? (
        <View style={styles.othersBox}>
          <View style={styles.othersHeader}>
            <Text style={styles.othersLabel}>📎 Others</Text>
            <TouchableOpacity
              onPress={() => {setIsOthers(false); setOthersDescription('');}}>
              <Text style={styles.clearText}>✕ Clear</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Describe the certificate (e.g. Blood Donation 2024)"
            placeholderTextColor="#9ca3af"
            value={othersDescription}
            onChangeText={setOthersDescription}
          />
        </View>
      ) : (
        <>
          {/* Category picker */}
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => {setCatOpen(!catOpen); setSubOpen(false); setLevelOpen(false); setPrizeOpen(false);}}>
            <Text style={selectedCat ? styles.selectorText : styles.selectorPH}>
              {selectedCat ? selectedCat.name : 'Select category'}
            </Text>
            <Text style={styles.chevron}>{catOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {catOpen && (
            <View style={styles.dropdownList}>
              {categories.map(c => (
                <TouchableOpacity
                  key={c._id}
                  style={[styles.dropdownItem, categoryId === c._id && styles.dropdownItemActive]}
                  onPress={() => {setCategoryId(c._id); setCatOpen(false);}}>
                  <Text style={[styles.dropdownMain, categoryId === c._id && styles.dropdownActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.dropdownItem} onPress={() => {activateOthers(); setCatOpen(false);}}>
                <Text style={styles.dropdownMain}>Others</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Subcategory */}
          {subcategories.length > 0 && (
            <>
              <Text style={styles.label}>Subcategory</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => {setSubOpen(!subOpen); setCatOpen(false); setLevelOpen(false); setPrizeOpen(false);}}>
                <Text style={subcategoryName ? styles.selectorText : styles.selectorPH}>
                  {subcategoryName || 'Select subcategory'}
                </Text>
                <Text style={styles.chevron}>{subOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {subOpen && (
                <View style={styles.dropdownList}>
                  {subcategories.map(s => (
                    <TouchableOpacity
                      key={s.name}
                      style={[styles.dropdownItem, subcategoryName === s.name && styles.dropdownItemActive]}
                      onPress={() => {setSubcategoryName(s.name); setSubOpen(false);}}>
                      <Text style={[styles.dropdownMain, subcategoryName === s.name && styles.dropdownActive]}>
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Level */}
          {hasLevels && (
            <>
              <Text style={styles.label}>Level</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => {setLevelOpen(!levelOpen); setCatOpen(false); setSubOpen(false); setPrizeOpen(false);}}>
                <Text style={levelSelected ? styles.selectorText : styles.selectorPH}>
                  {levelSelected || 'Select level'}
                </Text>
                <Text style={styles.chevron}>{levelOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {levelOpen && (
                <View style={styles.dropdownList}>
                  {currentSub.levels.map((l: any) => (
                    <TouchableOpacity
                      key={l.name}
                      style={[styles.dropdownItem, levelSelected === l.name && styles.dropdownItemActive]}
                      onPress={() => {setLevelSelected(l.name); setLevelOpen(false);}}>
                      <Text style={[styles.dropdownMain, levelSelected === l.name && styles.dropdownActive]}>
                        {l.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Prize */}
          {hasLevels && (
            <>
              <Text style={styles.label}>Prize Type</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => {setPrizeOpen(!prizeOpen); setCatOpen(false); setSubOpen(false); setLevelOpen(false);}}>
                <Text style={prizeType ? styles.selectorText : styles.selectorPH}>
                  {prizeType || 'Select prize type'}
                </Text>
                <Text style={styles.chevron}>{prizeOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {prizeOpen && (
                <View style={styles.dropdownList}>
                  {prizeLevels.map(p => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.dropdownItem, prizeType === p && styles.dropdownItemActive]}
                      onPress={() => {setPrizeType(p); setPrizeOpen(false);}}>
                      <Text style={[styles.dropdownMain, prizeType === p && styles.dropdownActive]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Event Name */}
          {subcategoryName && (
            <>
              <Text style={styles.label}>Event / Competition Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. NPTEL Python 2024, Hackathon MTI"
                placeholderTextColor="#9ca3af"
                value={eventName}
                onChangeText={setEventName}
                maxLength={120}
              />
            </>
          )}

          {/* Eligible Points */}
          {eligiblePoints !== null && (
            <View style={styles.eligibleBox}>
              <Text style={styles.eligibleText}>🏅 Eligible Points: {eligiblePoints}</Text>
              <Text style={styles.eligibleNote}>*Final points will be approved by tutor</Text>
            </View>
          )}
        </>
      )}

      {/* Dates */}
      <Text style={styles.label}>📅 Certificate Date / Activity Duration</Text>
      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <Text style={styles.dateLabel}>From / Date</Text>
          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9ca3af"
            value={dateFrom}
            onChangeText={setDateFrom}
          />
        </View>
        <View style={styles.dateField}>
          <Text style={styles.dateLabel}>To (optional)</Text>
          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9ca3af"
            value={dateTo}
            onChangeText={setDateTo}
          />
        </View>
      </View>

      {/* File Picker */}
      <TouchableOpacity style={styles.filePicker} onPress={handlePickFile}>
        <Text style={styles.filePickerText}>
          {uploadedFile
            ? `📎 ${uploadedFile.fileName || 'File selected'} (${((uploadedFile.fileSize || 0) / 1024 / 1024).toFixed(2)} MB)`
            : `📎 Choose File (Max ${MAX_FILE_SIZE_MB} MB)`}
        </Text>
      </TouchableOpacity>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, !canSubmit && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}>
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Submit Certificate</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f0f4ff'},
  content: {padding: 20, paddingBottom: 120},
  pageTitle: {fontSize: 22, fontWeight: '800', color: '#1e3a8a', marginBottom: 20},
  label: {fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 14, marginBottom: 6},
  input: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#111827',
  },
  dropdown: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, marginTop: 4, zIndex: 10,
  },
  dropdownList: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, marginTop: 4, maxHeight: 220, overflow: 'hidden',
  },
  dropdownItem: {paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6'},
  dropdownItemActive: {backgroundColor: '#eff6ff'},
  dropdownMain: {fontSize: 15, color: '#374151', fontWeight: '500'},
  dropdownActive: {color: '#1e3a8a', fontWeight: '700'},
  dropdownSub: {fontSize: 12, color: '#6b7280', marginTop: 2},
  selector: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  selectorText: {fontSize: 15, color: '#111827'},
  selectorPH: {fontSize: 15, color: '#9ca3af'},
  chevron: {color: '#6b7280', fontSize: 12},
  othersBox: {
    backgroundColor: '#eff6ff', borderRadius: 12, padding: 14, marginTop: 10,
    borderWidth: 1.5, borderColor: '#bfdbfe',
  },
  othersHeader: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8},
  othersLabel: {color: '#1e3a8a', fontWeight: '700', fontSize: 14},
  clearText: {color: '#dc2626', fontSize: 13, fontWeight: '500'},
  eligibleBox: {
    backgroundColor: '#fef9c3', borderRadius: 10, padding: 12, marginTop: 12,
    borderWidth: 1, borderColor: '#fde047',
  },
  eligibleText: {fontWeight: '700', color: '#854d0e', fontSize: 14},
  eligibleNote: {fontSize: 12, color: '#a16207', marginTop: 2},
  dateRow: {flexDirection: 'row', gap: 10},
  dateField: {flex: 1},
  dateLabel: {fontSize: 12, color: '#6b7280', marginBottom: 4},
  dateInput: {fontSize: 13},
  filePicker: {
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#3b82f6',
    borderStyle: 'dashed', borderRadius: 12, padding: 16, alignItems: 'center',
    marginTop: 16,
  },
  filePickerText: {color: '#2563eb', fontSize: 14, fontWeight: '600', textAlign: 'center'},
  submitBtn: {
    backgroundColor: '#1e3a8a', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 24,
  },
  submitDisabled: {opacity: 0.4},
  submitText: {color: '#fff', fontWeight: '700', fontSize: 16},
  successContainer: {
    flex: 1, backgroundColor: '#f0fdf4', alignItems: 'center',
    justifyContent: 'center', padding: 30,
  },
  successEmoji: {fontSize: 72, marginBottom: 20},
  successTitle: {fontSize: 24, fontWeight: '800', color: '#065f46', textAlign: 'center'},
  successSub: {fontSize: 15, color: '#047857', textAlign: 'center', marginTop: 10, lineHeight: 22},
  successBtn: {
    backgroundColor: '#059669', borderRadius: 12, paddingVertical: 14,
    paddingHorizontal: 28, marginTop: 28,
  },
  successBtnText: {color: '#fff', fontWeight: '700', fontSize: 16},
});
