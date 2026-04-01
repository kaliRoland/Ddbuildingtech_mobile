import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BRAND } from '../config/appConfig';
import { getJson } from '../utils/api';

const MARKETING_POINTS = [
  {
    icon: 'SUN',
    title: 'Sustainable Energy',
    description: 'Harness the power of the sun with our cutting-edge solar infrastructure solutions.',
  },
  {
    icon: 'SHD',
    title: 'Uncompromised Security',
    description: 'Advanced surveillance systems and robust perimeter defense for total peace of mind.',
  },
  {
    icon: '24/7',
    title: 'Expert Support',
    description: 'Our dedicated team of professionals provides 24/7 support and expert guidance.',
  },
];

function ProductCard({ item, onAddToCart, onPreviewImage, onOpenProduct }) {
  return (
    <Pressable style={styles.productCard} onPress={() => onOpenProduct(item)}>
      {item.image_main_url ? (
        <Pressable onPress={() => onPreviewImage(item.image_main_url)}>
          <Image source={{ uri: item.image_main_url }} style={styles.productImage} />
        </Pressable>
      ) : null}
      <Text style={styles.productCategory}>{item.category}</Text>
      <Text style={styles.productName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.productPrice}>
        {Number(item.price || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
      </Text>
      <Pressable style={styles.primaryButton} onPress={() => onAddToCart(item)}>
        <Text style={styles.primaryButtonText}>Add to Cart</Text>
      </Pressable>
    </Pressable>
  );
}

export default function HomeScreen({ onOpenGallery, onAddToCart, onPreviewImage, onOpenProduct }) {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const [featured, gallery] = await Promise.all([
          getJson('products.php', { action: 'get_featured', limit: 6 }),
          getJson('gallery.php', { action: 'get_all' }),
        ]);

        if (!active) {
          return;
        }

        setFeaturedProducts(Array.isArray(featured) ? featured : []);
        setGalleryItems(gallery?.items || []);
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

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>Advanced systems</Text>
        <Text style={styles.heroTitle}>Power your home and projects with trusted technology that lasts.</Text>
        <Text style={styles.heroText}>
          Shop trusted products,request installations and track support in one app.
        </Text>
        <View style={styles.heroActions}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Live products</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Trusted service</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Real installations</Text>
          </View>
        </View>
      </View>

      <View style={styles.marketingStrip}>
        <Text style={styles.marketingTitle}>Why Choose Us?</Text>
      </View>

      {MARKETING_POINTS.map((point) => (
        <View key={point.title} style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoIconText}>{point.icon}</Text>
            </View>
            <View style={styles.infoBody}>
              <Text style={styles.infoTitle}>{point.title}</Text>
              <Text style={styles.infoText}>{point.description}</Text>
            </View>
          </View>
        </View>
      ))}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Products</Text>
      </View>

      {loading ? <ActivityIndicator color={BRAND.blue} size="large" /> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
        {featuredProducts.map((item) => (
          <ProductCard
            key={item.id}
            item={item}
            onAddToCart={onAddToCart}
            onPreviewImage={onPreviewImage}
            onOpenProduct={onOpenProduct}
          />
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Gallery Posts</Text>
        <Pressable onPress={() => onOpenGallery(galleryItems)}>
          <Text style={styles.linkText}>Open Gallery</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
        {galleryItems.slice(0, 8).map((item) => (
          <Pressable key={item.id} style={styles.galleryCard} onPress={() => onOpenGallery(galleryItems, item.id)}>
            {item.primary_image_url ? (
              <Pressable onPress={() => onPreviewImage(item.primary_image_url)}>
                <Image source={{ uri: item.primary_image_url }} style={styles.galleryImage} />
              </Pressable>
            ) : null}
            <Text style={styles.galleryTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.blueSoft },
  content: { padding: 20, paddingBottom: 140, gap: 16 },
  hero: { backgroundColor: BRAND.blue, borderRadius: 28, padding: 24 },
  heroEyebrow: {
    color: BRAND.yellow,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  heroTitle: { color: BRAND.white, fontSize: 28, fontWeight: '800', lineHeight: 34 },
  heroText: { color: '#dce8ff', marginTop: 10, fontSize: 15, lineHeight: 22 },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 18,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: BRAND.white,
    fontWeight: '700',
    fontSize: 12,
  },
  marketingStrip: {
    backgroundColor: '#fff6dd',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f0d58b',
  },
  marketingTitle: { color: BRAND.blueDark, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  sectionTitle: { color: BRAND.text, fontSize: 22, fontWeight: '800' },
  infoCard: {
    backgroundColor: BRAND.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#edf4ff',
    borderWidth: 1,
    borderColor: '#cfe0fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconText: {
    color: BRAND.blue,
    fontSize: 12,
    fontWeight: '800',
  },
  infoBody: {
    flex: 1,
  },
  infoTitle: { color: BRAND.blue, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  infoText: { color: BRAND.muted, fontSize: 14, lineHeight: 20 },
  horizontalList: { gap: 14, paddingVertical: 4 },
  productCard: {
    width: 235,
    backgroundColor: BRAND.white,
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  productImage: {
    width: '100%',
    height: 150,
    borderRadius: 18,
    marginBottom: 10,
    backgroundColor: '#edf2f9',
  },
  productCategory: { color: BRAND.yellowDark, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  productName: { color: BRAND.text, fontSize: 15, fontWeight: '700', minHeight: 40 },
  productPrice: { color: BRAND.blue, fontSize: 17, fontWeight: '800', marginTop: 10, marginBottom: 12 },
  primaryButton: {
    backgroundColor: BRAND.yellow,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: BRAND.blueDark, fontWeight: '800' },
  galleryCard: {
    width: 230,
    backgroundColor: BRAND.white,
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  galleryImage: {
    width: '100%',
    height: 150,
    borderRadius: 18,
    marginBottom: 10,
    backgroundColor: '#edf2f9',
  },
  galleryTitle: { color: BRAND.text, fontWeight: '700', fontSize: 15 },
  linkText: { color: BRAND.blue, fontWeight: '700' },
  errorText: { color: BRAND.danger },
});
