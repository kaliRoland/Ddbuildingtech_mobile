import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { APP_COPY, BRAND } from '../config/appConfig';
import { getJson, postFormData } from '../utils/api';

const NIGERIA_STATE_OPTIONS = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
];

const EMPTY_FORM = {
  name: '',
  category: '',
  location: '',
  office_address: '',
  service_areas: ['', '', '', '', ''],
  phone: '',
  email: '',
  description: '',
  gallery: [],
};

const MAX_GALLERY = 5;
const MAX_IMAGE_BYTES = 1024 * 1024;

export default function ServiceAgentsScreen() {
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '', location: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [serviceAreaPickerOpen, setServiceAreaPickerOpen] = useState(false);
  const [serviceAreaPickerIndex, setServiceAreaPickerIndex] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const data = await getJson('vendors.php', { action: 'categories' });
        if (active) {
          setCategories(data.categories || []);
        }
      } catch (err) {
        if (active) {
          setCategories([]);
        }
      }
    }

    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadVendors() {
      try {
        setLoading(true);
        const data = await getJson('vendors.php', {
          action: 'list',
          q: filters.q,
          category: filters.category,
          location: filters.location,
        });

        if (!active) {
          return;
        }

        setVendors(data.vendors || []);
        setError('');
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadVendors();
    return () => {
      active = false;
    };
  }, [filters]);

  const categoryOptions = useMemo(() => ['All', ...categories], [categories]);

  function openServiceAreaPicker(index) {
    setServiceAreaPickerIndex(index);
    setServiceAreaPickerOpen(true);
  }

  function setServiceAreaForIndex(index, value) {
    setForm((current) => {
      const next = [...current.service_areas];
      const existingIndex = next.findIndex((area) => area === value);
      if (value && existingIndex !== -1 && existingIndex !== index) {
        return current;
      }
      next[index] = value;
      return { ...current, service_areas: next };
    });
  }

  async function submitAgent() {
    try {
      setSubmitting(true);
      setError('');
      setFeedback('');

      const body = new FormData();
      body.append('name', form.name);
      body.append('category', form.category);
      body.append('location', form.location);
      body.append('office_address', form.office_address);
      body.append('service_areas', JSON.stringify(form.service_areas.filter(Boolean)));
      body.append('phone', form.phone);
      body.append('email', form.email);
      body.append('description', form.description);

      form.gallery.slice(0, MAX_GALLERY).forEach((item) => {
        body.append('gallery[]', {
          uri: item.uri,
          name: item.name,
          type: item.type,
        });
      });

      const data = await postFormData('vendors.php?action=register', body);
      setFeedback(
        data.status_value === 'pending'
          ? 'Agent registration received and marked pending for admin approval.'
          : 'Agent registration submitted.'
      );
      setForm(EMPTY_FORM);
      setModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function openVendorDetails(vendor) {
    setSelectedVendor(vendor);
    setDetailOpen(true);

    try {
      const data = await getJson('vendors.php', { action: 'get', id: vendor.id });
      setSelectedVendor(data.vendor ? { ...data.vendor, gallery: data.gallery || [] } : vendor);
    } catch (err) {
      setSelectedVendor(vendor);
    }
  }

  async function pickGalleryImages() {
    const remaining = MAX_GALLERY - form.gallery.length;
    if (remaining <= 0) {
      setError('You can only upload up to five gallery images.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Media library permission is required to select gallery images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.9,
    });

    if (result.canceled) {
      return;
    }

    const next = [...form.gallery];
    let rejected = 0;

    for (const asset of result.assets) {
      if (next.length >= MAX_GALLERY) break;
      const info = await FileSystem.getInfoAsync(asset.uri);
      const size = asset.fileSize ?? info.size ?? 0;
      if (size > MAX_IMAGE_BYTES) {
        rejected += 1;
        continue;
      }
      const uri = asset.uri;
      const extMatch = uri.match(/\.([a-zA-Z0-9]+)(\?|$)/);
      const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
      const typeMap = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
      };
      const type = typeMap[ext] || 'image/jpeg';
      const name = asset.fileName || `gallery_${Date.now()}_${next.length + 1}.${ext}`;
      next.push({ uri, name, type, size });
    }

    setForm((current) => ({ ...current, gallery: next }));
    if (rejected > 0) {
      setError(`${rejected} image(s) exceeded 1MB and were skipped.`);
    }
  }

  function removeGalleryImage(index) {
    setForm((current) => ({
      ...current,
      gallery: current.gallery.filter((_, i) => i !== index),
    }));
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Service Agents</Text>
        <Text style={styles.heroText}>
          Discover approved vendors by specialty and location, or submit one registration for review.
        </Text>
      </View>

      <View style={styles.actionCard}>
        <View style={styles.topActions}>
          <Pressable style={styles.iconButton} onPress={() => setFilterOpen(true)}>
            <Text style={styles.iconGlyph}>Find</Text>
          </Pressable>
          <Pressable style={styles.registerButton} onPress={() => setModalOpen(true)}>
            <Text style={styles.registerButtonText}>Register Agent</Text>
          </Pressable>
        </View>
        <Text style={styles.noteText}>{APP_COPY.vendorGate}</Text>
        {feedback ? <Text style={styles.successText}>{feedback}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      {loading ? <ActivityIndicator color={BRAND.blue} size="large" /> : null}

      {!loading && vendors.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No approved agents found</Text>
          <Text style={styles.emptyText}>Try the search icon or submit a new service-agent registration.</Text>
        </View>
      ) : null}

      {vendors.map((item) => (
        <Pressable key={item.id} style={styles.vendorCard} onPress={() => openVendorDetails(item)}>
          <View style={styles.vendorHeader}>
            <Text style={styles.vendorName}>{item.name}</Text>
            <Text style={styles.vendorCategory}>{item.category}</Text>
          </View>
          <Text style={styles.vendorLocation}>{item.location}</Text>
          {item.office_address ? <Text style={styles.vendorMeta}>Office: {item.office_address}</Text> : null}
          {Array.isArray(item.service_areas) && item.service_areas.length > 0 ? (
            <View style={styles.serviceAreaWrap}>
              {item.service_areas.slice(0, 5).map((area) => (
                <View key={`${item.id}-${area}`} style={styles.serviceAreaPill}>
                  <Text style={styles.serviceAreaText}>{area}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <Text style={styles.vendorDescription}>{item.description || 'No description supplied.'}</Text>
          {Array.isArray(item.gallery_images) && item.gallery_images.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
              {item.gallery_images.slice(0, 5).map((url, index) => (
                <Image key={`${item.id}-gallery-${index}`} source={{ uri: url }} style={styles.galleryImage} />
              ))}
            </ScrollView>
          ) : null}
          <Text style={styles.vendorMeta}>Phone: {item.phone || 'Not available'}</Text>
          <Text style={styles.vendorMeta}>Email: {item.email || 'Not available'}</Text>
        </Pressable>
      ))}

      <Modal visible={filterOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Search and Filter Agents</Text>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <TextInput
                style={styles.input}
                placeholder="Search service agents"
                value={filters.q}
                onChangeText={(value) => setFilters((current) => ({ ...current, q: value }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Filter by location"
                value={filters.location}
                onChangeText={(value) => setFilters((current) => ({ ...current, location: value }))}
              />
              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {categoryOptions.map((item) => {
                  const isActive =
                    (item === 'All' && !filters.category) || (item !== 'All' && item === filters.category);
                  return (
                    <Pressable
                      key={item}
                      style={[styles.chip, isActive && styles.chipActive]}
                      onPress={() =>
                        setFilters((current) => ({ ...current, category: item === 'All' ? '' : item }))
                      }
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{item}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  setFilters({ q: '', category: '', location: '' });
                }}
              >
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={() => setFilterOpen(false)}>
                <Text style={styles.primaryButtonText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Register Service Agent</Text>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <TextInput
                style={styles.input}
                placeholder="Business or agent name"
                value={form.name}
                onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Category"
                value={form.category}
                onChangeText={(value) => setForm((current) => ({ ...current, category: value }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Location"
                value={form.location}
                onChangeText={(value) => setForm((current) => ({ ...current, location: value }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Office address"
                value={form.office_address}
                onChangeText={(value) => setForm((current) => ({ ...current, office_address: value }))}
              />
              <Text style={styles.fieldLabel}>Service areas (select up to five)</Text>
              <View style={styles.serviceAreaPickerWrap}>
                {form.service_areas.map((area, index) => (
                  <Pressable
                    key={`service-area-${index}`}
                    style={styles.dropdownField}
                    onPress={() => openServiceAreaPicker(index)}
                  >
                    <Text style={[styles.dropdownText, !area && styles.dropdownPlaceholder]}>
                      {area || `Select service area ${index + 1}`}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder="Phone"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(value) => setForm((current) => ({ ...current, phone: value }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(value) => setForm((current) => ({ ...current, email: value }))}
              />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Description"
                multiline
                textAlignVertical="top"
                value={form.description}
                onChangeText={(value) => setForm((current) => ({ ...current, description: value }))}
              />
              <Text style={styles.fieldLabel}>Gallery images (up to 5, max 1MB each)</Text>
              <Pressable style={styles.uploadButton} onPress={pickGalleryImages}>
                <Text style={styles.uploadButtonText}>
                  Add images ({form.gallery.length}/{MAX_GALLERY})
                </Text>
              </Pressable>
              {form.gallery.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
                  {form.gallery.map((item, index) => (
                    <View key={`gallery-pick-${index}`} style={styles.galleryPreviewWrap}>
                      <Image source={{ uri: item.uri }} style={styles.galleryPreview} />
                      <Pressable
                        style={styles.galleryRemove}
                        onPress={() => removeGalleryImage(index)}
                      >
                        <Text style={styles.galleryRemoveText}>Remove</Text>
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              ) : null}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setModalOpen(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={submitAgent} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color={BRAND.blueDark} />
                ) : (
                  <Text style={styles.primaryButtonText}>Submit</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={detailOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Agent Details</Text>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {selectedVendor ? (
                <>
                  <Text style={styles.vendorName}>{selectedVendor.name}</Text>
                  <Text style={styles.vendorCategoryInline}>{selectedVendor.category}</Text>
                  <Text style={styles.vendorLocation}>{selectedVendor.location}</Text>
                  {selectedVendor.office_address ? (
                    <Text style={styles.vendorMeta}>Office: {selectedVendor.office_address}</Text>
                  ) : null}
                  {Array.isArray(selectedVendor.service_areas) && selectedVendor.service_areas.length > 0 ? (
                    <View style={styles.serviceAreaWrap}>
                      {selectedVendor.service_areas.slice(0, 5).map((area) => (
                        <View key={`detail-${selectedVendor.id}-${area}`} style={styles.serviceAreaPill}>
                          <Text style={styles.serviceAreaText}>{area}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  <Text style={styles.vendorDescription}>
                    {selectedVendor.description || 'No description supplied.'}
                  </Text>
                  {Array.isArray(selectedVendor.gallery_images) && selectedVendor.gallery_images.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
                      {selectedVendor.gallery_images.slice(0, 5).map((url, index) => (
                        <Image key={`detail-gallery-${index}`} source={{ uri: url }} style={styles.detailGalleryImage} />
                      ))}
                    </ScrollView>
                  ) : null}
                  <Text style={styles.vendorMeta}>Phone: {selectedVendor.phone || 'Not available'}</Text>
                  <Text style={styles.vendorMeta}>Email: {selectedVendor.email || 'Not available'}</Text>
                </>
              ) : null}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.primaryButton} onPress={() => setDetailOpen(false)}>
                <Text style={styles.primaryButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={serviceAreaPickerOpen} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Service Area</Text>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {form.service_areas[serviceAreaPickerIndex] ? (
                <Pressable
                  style={[styles.chip, styles.clearChip]}
                  onPress={() => {
                    setServiceAreaForIndex(serviceAreaPickerIndex, '');
                    setServiceAreaPickerOpen(false);
                  }}
                >
                  <Text style={styles.clearChipText}>Clear selection</Text>
                </Pressable>
              ) : null}
              {NIGERIA_STATE_OPTIONS.map((state) => {
                const selected = form.service_areas.includes(state);
                const isCurrent = form.service_areas[serviceAreaPickerIndex] === state;
                const disabled = selected && !isCurrent;
                return (
                  <Pressable
                    key={state}
                    style={[styles.chip, selected && styles.chipActive, disabled && styles.disabledChip]}
                    onPress={() => {
                      if (disabled) return;
                      setServiceAreaForIndex(serviceAreaPickerIndex, state);
                      setServiceAreaPickerOpen(false);
                    }}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>{state}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setServiceAreaPickerOpen(false)}>
                <Text style={styles.secondaryButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.blueSoft },
  content: { padding: 20, paddingBottom: 140, gap: 16 },
  hero: {
    backgroundColor: BRAND.blue,
    borderRadius: 28,
    padding: 22,
  },
  heroTitle: {
    color: BRAND.white,
    fontSize: 26,
    fontWeight: '800',
  },
  heroText: {
    color: '#dce8ff',
    marginTop: 10,
    lineHeight: 21,
  },
  actionCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 18,
    gap: 12,
  },
  topActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    minWidth: 64,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#edf4ff',
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  iconGlyph: {
    color: BRAND.blue,
    fontSize: 14,
    fontWeight: '700',
  },
  registerButton: {
    flex: 1,
    backgroundColor: BRAND.yellow,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    color: BRAND.blueDark,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f8fbff',
    color: BRAND.text,
  },
  fieldLabel: {
    color: BRAND.text,
    fontWeight: '700',
    marginTop: 2,
  },
  chipRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.white,
  },
  chipActive: {
    backgroundColor: BRAND.blue,
    borderColor: BRAND.blue,
  },
  disabledChip: {
    opacity: 0.45,
  },
  chipText: {
    color: BRAND.text,
    fontWeight: '700',
  },
  chipTextActive: {
    color: BRAND.white,
  },
  serviceAreaPickerWrap: {
    gap: 10,
  },
  dropdownField: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#f8fbff',
  },
  dropdownText: {
    color: BRAND.text,
    fontWeight: '700',
  },
  dropdownPlaceholder: {
    color: BRAND.muted,
  },
  clearChip: {
    backgroundColor: '#fff3e6',
    borderColor: '#ffd7b0',
  },
  clearChipText: {
    color: BRAND.yellowDark,
    fontWeight: '700',
  },
  noteText: {
    color: BRAND.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  successText: {
    color: BRAND.success,
  },
  errorText: {
    color: BRAND.danger,
  },
  emptyCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 18,
  },
  emptyTitle: {
    color: BRAND.text,
    fontWeight: '800',
    fontSize: 18,
  },
  emptyText: {
    color: BRAND.muted,
    marginTop: 8,
    lineHeight: 21,
  },
  vendorCard: {
    backgroundColor: BRAND.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 18,
    gap: 8,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  vendorName: {
    flex: 1,
    color: BRAND.text,
    fontWeight: '800',
    fontSize: 18,
  },
  vendorCategory: {
    color: BRAND.blue,
    backgroundColor: '#deebff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    fontWeight: '700',
  },
  vendorCategoryInline: {
    color: BRAND.blue,
    fontWeight: '700',
  },
  vendorLocation: {
    color: BRAND.yellowDark,
    fontWeight: '700',
  },
  vendorDescription: {
    color: BRAND.muted,
    lineHeight: 20,
  },
  vendorMeta: {
    color: BRAND.text,
    fontSize: 13,
  },
  serviceAreaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceAreaPill: {
    backgroundColor: '#edf4ff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  serviceAreaText: {
    color: BRAND.blue,
    fontWeight: '700',
    fontSize: 12,
  },
  galleryRow: {
    gap: 10,
    paddingTop: 4,
  },
  uploadButton: {
    backgroundColor: '#edf4ff',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  uploadButtonText: {
    color: BRAND.blue,
    fontWeight: '800',
  },
  galleryPreviewWrap: {
    width: 110,
    alignItems: 'center',
    gap: 6,
  },
  galleryPreview: {
    width: 100,
    height: 100,
    borderRadius: 14,
    backgroundColor: '#edf2f9',
  },
  galleryRemove: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#ffe9e9',
  },
  galleryRemoveText: {
    color: BRAND.danger,
    fontWeight: '700',
    fontSize: 12,
  },
  galleryImage: {
    width: 94,
    height: 94,
    borderRadius: 14,
    backgroundColor: '#edf2f9',
  },
  detailGalleryImage: {
    width: 150,
    height: 150,
    borderRadius: 16,
    backgroundColor: '#edf2f9',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: BRAND.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    color: BRAND.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 14,
  },
  modalContent: {
    gap: 12,
  },
  textarea: {
    minHeight: 110,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  primaryButton: {
    backgroundColor: BRAND.yellow,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    flex: 1,
  },
  primaryButtonText: {
    color: BRAND.blueDark,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: BRAND.white,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  secondaryButtonText: {
    color: BRAND.text,
    fontWeight: '700',
  },
});
