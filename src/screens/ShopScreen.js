import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BRAND } from '../config/appConfig';
import { getJson } from '../utils/api';

function ProductTile({ item, onAddToCart, onPreviewImage, onOpenProduct }) {
  return (
    <Pressable style={styles.card} onPress={() => onOpenProduct(item)}>
      {item.image_main_url ? (
        <Pressable onPress={() => onPreviewImage(item.image_main_url)}>
          <Image source={{ uri: item.image_main_url }} style={styles.cardImage} />
        </Pressable>
      ) : null}
      <Text style={styles.cardName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.cardMeta}>{item.category}</Text>
      <Text style={styles.cardPrice}>
        {Number(item.price || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
      </Text>
      <Pressable style={styles.addButton} onPress={() => onAddToCart(item)}>
        <Text style={styles.addButtonText}>Add to Cart</Text>
      </Pressable>
    </Pressable>
  );
}

export default function ShopScreen({ cartCount, onOpenCart, onAddToCart, onPreviewImage, onOpenProduct }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1 });
  const [filters, setFilters] = useState({
    search: '',
    maxPrice: '',
    category: '',
    subcategory: '',
    sort: 'created_at_desc',
    page: 1,
  });

  const categoryTree = useMemo(() => {
    const parents = categories.filter((item) => !item.parent_id || Number(item.parent_id) === 0);
    const childrenMap = new Map();

    categories.forEach((item) => {
      if (item.parent_id && Number(item.parent_id) > 0) {
        const key = String(item.parent_id);
        const list = childrenMap.get(key) || [];
        list.push(item);
        childrenMap.set(key, list);
      }
    });

    return { parents, childrenMap };
  }, [categories]);

  const availableSubcategories = useMemo(() => {
    if (!filters.category) {
      return [];
    }
    return categoryTree.childrenMap.get(String(filters.category)) || [];
  }, [categoryTree, filters.category]);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        setLoading(true);
        const data = await getJson('products.php', {
          action: 'get_all',
          page: filters.page,
          search: filters.search,
          max_price: filters.maxPrice,
          category: filters.category,
          subcategory: filters.subcategory,
          sort: filters.sort,
          limit: 12,
        });

        if (!active) {
          return;
        }

        setProducts(data.products || []);
        setCategories(data.categories || []);
        setPagination(data.pagination || { page: 1, total_pages: 1 });
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

    loadProducts();
    return () => {
      active = false;
    };
  }, [filters]);

  function updateFilter(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? value : 1,
      ...(key === 'category' ? { subcategory: '' } : {}),
    }));
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Shop</Text>
          <Text style={styles.headerSubtitle}>Live product feed from the website</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconButton} onPress={() => setFiltersOpen(true)}>
            <Text style={styles.iconText}>Search</Text>
          </Pressable>
          <Pressable style={styles.iconButton} onPress={onOpenCart}>
            <Text style={styles.iconText}>Cart {cartCount}</Text>
          </Pressable>
        </View>
      </View>

      {loading ? <ActivityIndicator size="large" color={BRAND.blue} style={styles.loader} /> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ProductTile
            item={item}
            onAddToCart={onAddToCart}
            onPreviewImage={onPreviewImage}
            onOpenProduct={onOpenProduct}
          />
        )}
        ListFooterComponent={
          <View style={styles.pagination}>
            <Pressable
              style={[styles.pageButton, filters.page <= 1 && styles.disabledButton]}
              disabled={filters.page <= 1}
              onPress={() => updateFilter('page', Math.max(1, filters.page - 1))}
            >
              <Text style={styles.pageButtonText}>Prev</Text>
            </Pressable>
            <Text style={styles.pageLabel}>
              Page {pagination.page || 1} / {pagination.total_pages || 1}
            </Text>
            <Pressable
              style={[
                styles.pageButton,
                (pagination.page || 1) >= (pagination.total_pages || 1) && styles.disabledButton,
              ]}
              disabled={(pagination.page || 1) >= (pagination.total_pages || 1)}
              onPress={() => updateFilter('page', (pagination.page || 1) + 1)}
            >
              <Text style={styles.pageButtonText}>Next</Text>
            </Pressable>
          </View>
        }
      />

      <Modal visible={filtersOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Search and Filter</Text>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <TextInput
                style={styles.input}
                placeholder="Search products"
                value={filters.search}
                onChangeText={(value) => updateFilter('search', value)}
              />
              <TextInput
                style={styles.input}
                placeholder="Max price in NGN"
                value={filters.maxPrice}
                keyboardType="numeric"
                onChangeText={(value) => updateFilter('maxPrice', value)}
              />
              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                <Pressable
                  style={[styles.chip, !filters.category && styles.chipActive]}
                  onPress={() => updateFilter('category', '')}
                >
                  <Text style={[styles.chipText, !filters.category && styles.chipTextActive]}>All</Text>
                </Pressable>
                {categoryTree.parents.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.chip, String(filters.category) === String(item.id) && styles.chipActive]}
                    onPress={() => updateFilter('category', String(item.id))}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        String(filters.category) === String(item.id) && styles.chipTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {availableSubcategories.length > 0 ? (
                <>
                  <Text style={styles.fieldLabel}>Sub Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    <Pressable
                      style={[styles.chip, !filters.subcategory && styles.chipActive]}
                      onPress={() => updateFilter('subcategory', '')}
                    >
                      <Text style={[styles.chipText, !filters.subcategory && styles.chipTextActive]}>All</Text>
                    </Pressable>
                    {availableSubcategories.map((item) => (
                      <Pressable
                        key={item.id}
                        style={[
                          styles.chip,
                          String(filters.subcategory) === String(item.id) && styles.chipActive,
                        ]}
                        onPress={() => updateFilter('subcategory', String(item.id))}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            String(filters.subcategory) === String(item.id) && styles.chipTextActive,
                          ]}
                        >
                          {item.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              ) : null}

              <Text style={styles.fieldLabel}>Sort</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {[
                  ['created_at_desc', 'Latest'],
                  ['price_asc', 'Low to High'],
                  ['price_desc', 'High to Low'],
                  ['name_asc', 'A to Z'],
                ].map(([value, label]) => (
                  <Pressable
                    key={value}
                    style={[styles.chip, filters.sort === value && styles.chipActive]}
                    onPress={() => updateFilter('sort', value)}
                  >
                    <Text style={[styles.chipText, filters.sort === value && styles.chipTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.secondaryButton, styles.flexButton]}
                onPress={() => {
                  setFilters({
                    search: '',
                    maxPrice: '',
                    category: '',
                    subcategory: '',
                    sort: 'created_at_desc',
                    page: 1,
                  });
                }}
              >
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </Pressable>
              <Pressable style={[styles.primaryButton, styles.flexButton]} onPress={() => setFiltersOpen(false)}>
                <Text style={styles.primaryButtonText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.blueSoft },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: { color: BRAND.text, fontSize: 28, fontWeight: '800' },
  headerSubtitle: { color: BRAND.muted, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconButton: {
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconText: { color: BRAND.blue, fontWeight: '700' },
  loader: { marginTop: 24 },
  listContent: { paddingHorizontal: 20, paddingBottom: 140, paddingTop: 10 },
  columns: { justifyContent: 'space-between', marginBottom: 16 },
  card: {
    width: '48%',
    backgroundColor: BRAND.white,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  cardImage: { width: '100%', height: 120, borderRadius: 14, backgroundColor: '#edf2f9', marginBottom: 10 },
  cardName: { color: BRAND.text, fontWeight: '700', minHeight: 40 },
  cardMeta: { color: BRAND.muted, fontSize: 12, marginTop: 6 },
  cardPrice: { color: BRAND.blue, fontWeight: '800', marginVertical: 10, fontSize: 14 },
  addButton: {
    backgroundColor: BRAND.yellow,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  addButtonText: { color: BRAND.blueDark, fontWeight: '800' },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 18,
    padding: 14,
  },
  pageButton: {
    backgroundColor: BRAND.blue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  disabledButton: { opacity: 0.45 },
  pageButtonText: { color: BRAND.white, fontWeight: '700' },
  pageLabel: { color: BRAND.text, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: BRAND.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: { color: BRAND.text, fontSize: 22, fontWeight: '800', marginBottom: 16 },
  modalContent: { gap: 14 },
  input: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: BRAND.text,
    backgroundColor: '#f8fbff',
  },
  fieldLabel: { color: BRAND.text, fontWeight: '700', marginTop: 4 },
  chipRow: { gap: 8, paddingVertical: 4 },
  chip: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: BRAND.white,
  },
  chipActive: { backgroundColor: BRAND.blue, borderColor: BRAND.blue },
  chipText: { color: BRAND.text, fontWeight: '600' },
  chipTextActive: { color: BRAND.white },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 18 },
  flexButton: { flex: 1 },
  primaryButton: {
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryButtonText: { color: BRAND.blueDark, fontWeight: '800' },
  secondaryButton: {
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  secondaryButtonText: { color: BRAND.text, fontWeight: '700' },
  errorText: { color: BRAND.danger, paddingHorizontal: 20, marginTop: 12 },
});
