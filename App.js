import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import ServiceAgentsScreen from './src/screens/ServiceAgentsScreen';
import ShopScreen from './src/screens/ShopScreen';
import SupportScreen from './src/screens/SupportScreen';
import { BRAND, CHAT_URL } from './src/config/appConfig';
import { getJson, postJson } from './src/utils/api';

const SESSION_KEY = 'dd-mobile-session';
const TABS = [
  { key: 'home', label: 'Home' },
  { key: 'shop', label: 'Shop' },
  { key: 'support', label: 'Support' },
  { key: 'agents', label: 'Agents' },
  { key: 'login', label: 'Login' },
];

function GalleryModal({ visible, items, onClose, onPreviewImage }) {
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalScreen}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Gallery</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.modalClose}>Close</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.galleryContent}>
          {items.map((item) => (
            <View key={item.id} style={styles.galleryModalCard}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryImageRow}
              >
                {(item.image_urls || []).map((url, index) => (
                  <Pressable key={`${item.id}-${index}`} onPress={() => onPreviewImage(url)}>
                    <Image source={{ uri: url }} style={styles.galleryModalImage} />
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={styles.galleryModalTitle}>{item.title}</Text>
              <Text style={styles.galleryModalText}>
                {item.description || 'Project post from the live website gallery.'}
              </Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function ImagePreviewModal({ visible, imageUrl, onClose }) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.imageBackdrop}>
        <Pressable style={styles.imageCloseButton} onPress={onClose}>
          <Text style={styles.imageCloseText}>Close</Text>
        </Pressable>
        <Pressable style={styles.imageStage} onPress={onClose}>
          {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.fullImage} resizeMode="contain" /> : null}
        </Pressable>
      </View>
    </Modal>
  );
}

function ProductModal({ visible, product, loading, onClose, onPreviewImage, onAddToCart }) {
  if (!visible) {
    return null;
  }

  const gallery = [product?.image_main_url, product?.image_1_url, product?.image_2_url, product?.image_3_url].filter(
    Boolean
  );

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalScreen}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Product Details</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.modalClose}>Close</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.productModalContent}>
          {loading ? <Text style={styles.emptyText}>Loading product...</Text> : null}
          {!loading && product ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryImageRow}>
                {gallery.map((url, index) => (
                  <Pressable key={`${product.id}-${index}`} onPress={() => onPreviewImage(url)}>
                    <Image source={{ uri: url }} style={styles.galleryModalImage} />
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={styles.productModalName}>{product.name}</Text>
              <Text style={styles.productModalCategory}>{product.category}</Text>
              <Text style={styles.productModalPrice}>
                {Number(product.price || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
              </Text>
              <Text style={styles.productModalText}>{product.description || 'No product description available yet.'}</Text>
              <Pressable style={styles.productModalButton} onPress={() => onAddToCart(product)}>
                <Text style={styles.productModalButtonText}>Add to Cart</Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function ChatModal({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalScreen}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Live Chat</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.modalClose}>Close</Text>
          </Pressable>
        </View>
        <WebView source={{ uri: CHAT_URL }} startInLoadingState style={styles.chatWebview} />
      </SafeAreaView>
    </Modal>
  );
}

function NotificationsModal({ visible, notifications, onClose, onOpenImage, onMarkRead }) {
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalScreen}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Notifications</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.modalClose}>Close</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.notificationList}>
          {notifications.length === 0 ? <Text style={styles.emptyText}>No notifications yet.</Text> : null}
          {notifications.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.notificationCard, Number(item.is_read) === 0 && styles.notificationCardUnread]}
              onPress={() => onMarkRead(item.id)}
            >
              {item.image_url ? (
                <Pressable onPress={() => onOpenImage(item.image_url)}>
                  <Image source={{ uri: item.image_url }} style={styles.notificationImage} />
                </Pressable>
              ) : null}
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationType}>{String(item.notification_type || 'announcement').replace('_', ' ')}</Text>
                {Number(item.is_read) === 0 ? <Text style={styles.unreadDot}>New</Text> : null}
              </View>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationBody}>{item.body}</Text>
              <Text style={styles.notificationDate}>{item.created_at}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function CartModal({ visible, items, onClose, onClear }) {
  const total = items.reduce((sum, item) => sum + Number(item.price || 0) * item.qty, 0);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.sheetBackdrop}>
        <View style={styles.sheetCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cart</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.modalClose}>Close</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.cartContent}>
            {items.length === 0 ? <Text style={styles.emptyText}>Your cart is still empty.</Text> : null}
            {items.map((item) => (
              <View key={item.id} style={styles.cartRow}>
                <View style={styles.cartMeta}>
                  <Text style={styles.cartName}>{item.name}</Text>
                  <Text style={styles.cartQty}>Qty {item.qty}</Text>
                </View>
                <Text style={styles.cartPrice}>
                  {Number(item.price || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                </Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.cartFooter}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {total.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
            </Text>
          </View>
          <Pressable style={styles.secondaryWideButton} onPress={onClear}>
            <Text style={styles.secondaryWideButtonText}>Clear Cart</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productOpen, setProductOpen] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (!active || !raw) {
          return;
        }
        const saved = JSON.parse(raw);
        if (!saved?.token) {
          return;
        }
        const me = await getJson('auth.php', { action: 'me' }, saved.token);
        if (active) {
          setSession({ token: saved.token, user: me.user });
        }
      } catch (error) {
        if (active) {
          await AsyncStorage.removeItem(SESSION_KEY);
        }
      } finally {
        if (active) {
          setBooting(false);
        }
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      try {
        const data = await getJson('notifications.php', undefined, session?.token);
        if (active) {
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        if (active) {
          setNotifications([]);
        }
      }
    }

    loadNotifications();
    return () => {
      active = false;
    };
  }, [session]);

  async function persistSession(nextSession) {
    setSession(nextSession);
    if (nextSession?.token) {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    } else {
      await AsyncStorage.removeItem(SESSION_KEY);
    }
  }

  async function handleLogin(payload) {
    setAuthLoading(true);
    try {
      const response = await postJson('auth.php?action=login', payload);
      await persistSession({ token: response.token, user: response.user });
      setActiveTab('support');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister(payload) {
    setAuthLoading(true);
    try {
      const response = await postJson('auth.php?action=register', payload);
      await persistSession({ token: response.token, user: response.user });
      setActiveTab('support');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    try {
      if (session?.token) {
        await postJson('auth.php?action=logout', {}, session.token);
      }
    } catch (error) {
      // Local sign-out should still complete even if the remote token delete fails.
    } finally {
      await persistSession(null);
      setActiveTab('login');
    }
  }

  function requireLogin() {
    Alert.alert('Login required', 'Please sign in before using support or chat.');
    setActiveTab('login');
  }

  function handleTabPress(tabKey) {
    if (tabKey === 'support' && !session?.token) {
      requireLogin();
      return;
    }
    setActiveTab(tabKey);
  }

  function handleAddToCart(item) {
    setCartItems((current) => {
      const found = current.find((entry) => String(entry.id) === String(item.id));
      if (found) {
        return current.map((entry) =>
          String(entry.id) === String(item.id) ? { ...entry, qty: entry.qty + 1 } : entry
        );
      }
      return [...current, { ...item, qty: 1 }];
    });
  }

  function openGallery(items) {
    setGalleryItems(Array.isArray(items) ? items : []);
    setGalleryOpen(true);
  }

  function handlePreviewImage(imageUrl) {
    setPreviewImage(imageUrl || '');
  }

  async function handleOpenProduct(product) {
    setProductOpen(true);
    setProductLoading(true);
    setSelectedProduct(product || null);

    try {
      const data = await getJson('products.php', { action: 'get_one', id: product?.id });
      setSelectedProduct(data.product || product || null);
    } catch (error) {
      setSelectedProduct(product || null);
    } finally {
      setProductLoading(false);
    }
  }

  async function handleOpenChat() {
    if (!session?.token) {
      requireLogin();
      return;
    }
    setChatOpen(true);
  }

  async function handleMarkNotificationRead(notificationId) {
    setNotifications((current) =>
      current.map((item) => (String(item.id) === String(notificationId) ? { ...item, is_read: 1 } : item))
    );

    if (!session?.token) {
      return;
    }

    try {
      await postJson('notifications.php?action=mark_read', { notification_id: notificationId }, session.token);
    } catch (error) {
      // Keep optimistic UI state.
    }
  }

  if (booting) {
    return (
      <SafeAreaView style={styles.bootScreen}>
        <StatusBar barStyle="light-content" />
        <Image source={require('./assets/logo.png')} style={styles.bootLogo} />
        <Text style={styles.bootTitle}>DDBuildingTech Mobile</Text>
        <Text style={styles.bootText}>Loading website-connected mobile experience...</Text>
      </SafeAreaView>
    );
  }

  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const unreadNotificationCount = notifications.filter((item) => Number(item.is_read) === 0).length;

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topBrand}>
        <View>
          <Text style={styles.brandTitle}>DDBuildingTech</Text>
          <Text style={styles.brandSubtitle}>Advanced systems</Text>
        </View>
        <View style={styles.topActions}>
          <Pressable style={styles.notificationBell} onPress={() => setNotificationsOpen(true)}>
            <Text style={styles.notificationBellText}>Alerts</Text>
            {unreadNotificationCount > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadNotificationCount}</Text>
              </View>
            ) : null}
          </Pressable>
          <Image source={require('./assets/logo.png')} style={styles.brandLogo} />
        </View>
      </View>

      <View style={styles.screenWrap}>
        {activeTab === 'home' ? (
          <HomeScreen
            onOpenGallery={openGallery}
            onAddToCart={handleAddToCart}
            onPreviewImage={handlePreviewImage}
            onOpenProduct={handleOpenProduct}
          />
        ) : null}
        {activeTab === 'shop' ? (
          <ShopScreen
            cartCount={cartCount}
            onOpenCart={() => setCartOpen(true)}
            onAddToCart={handleAddToCart}
            onPreviewImage={handlePreviewImage}
            onOpenProduct={handleOpenProduct}
          />
        ) : null}
        {activeTab === 'support' ? (
          <SupportScreen session={session} onRequireLogin={requireLogin} />
        ) : null}
        {activeTab === 'agents' ? <ServiceAgentsScreen /> : null}
        {activeTab === 'login' ? (
          <LoginScreen
            session={session}
            loading={authLoading}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onLogout={handleLogout}
          />
        ) : null}
      </View>

      <View style={styles.tabShell}>
        <Pressable style={styles.chatBubble} onPress={handleOpenChat}>
          <Text style={styles.chatBubbleText}>Live Chat</Text>
        </Pressable>
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                style={[styles.tabButton, active && styles.tabButtonActive]}
                onPress={() => handleTabPress(tab.key)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <GalleryModal
        visible={galleryOpen}
        items={galleryItems}
        onClose={() => setGalleryOpen(false)}
        onPreviewImage={handlePreviewImage}
      />
      <CartModal
        visible={cartOpen}
        items={cartItems}
        onClose={() => setCartOpen(false)}
        onClear={() => setCartItems([])}
      />
      <ImagePreviewModal
        visible={Boolean(previewImage)}
        imageUrl={previewImage}
        onClose={() => setPreviewImage('')}
      />
      <ProductModal
        visible={productOpen}
        product={selectedProduct}
        loading={productLoading}
        onClose={() => setProductOpen(false)}
        onPreviewImage={handlePreviewImage}
        onAddToCart={handleAddToCart}
      />
      <ChatModal visible={chatOpen} onClose={() => setChatOpen(false)} />
      <NotificationsModal
        visible={notificationsOpen}
        notifications={notifications}
        onClose={() => setNotificationsOpen(false)}
        onOpenImage={handlePreviewImage}
        onMarkRead={handleMarkNotificationRead}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: BRAND.blueSoft,
  },
  bootScreen: {
    flex: 1,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  bootLogo: {
    width: 92,
    height: 92,
    resizeMode: 'contain',
    marginBottom: 18,
  },
  bootTitle: {
    color: BRAND.white,
    fontSize: 28,
    fontWeight: '800',
  },
  bootText: {
    color: '#dce8ff',
    marginTop: 10,
    textAlign: 'center',
  },
  topBrand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  brandTitle: {
    color: BRAND.blueDark,
    fontSize: 22,
    fontWeight: '800',
  },
  brandSubtitle: {
    color: BRAND.muted,
    marginTop: 2,
  },
  brandLogo: {
    width: 38,
    height: 38,
    resizeMode: 'contain',
    borderRadius: 10,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationBell: {
    minWidth: 66,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBellText: {
    color: BRAND.blue,
    fontWeight: '800',
    fontSize: 12,
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  notificationBadgeText: {
    color: BRAND.blueDark,
    fontWeight: '800',
    fontSize: 11,
  },
  screenWrap: {
    flex: 1,
  },
  tabShell: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
  },
  chatBubble: {
    alignSelf: 'flex-end',
    backgroundColor: BRAND.yellow,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 13,
    marginBottom: 14,
    marginRight: 6,
    shadowColor: '#00142c',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  chatBubbleText: {
    color: BRAND.blueDark,
    fontWeight: '800',
    fontSize: 13,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(8,38,77,0.94)',
    borderRadius: 28,
    padding: 8,
    gap: 6,
    shadowColor: '#00142c',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: BRAND.yellow,
  },
  tabText: {
    color: '#dce8ff',
    fontWeight: '700',
    fontSize: 12,
  },
  tabTextActive: {
    color: BRAND.blueDark,
  },
  modalScreen: {
    flex: 1,
    backgroundColor: BRAND.blueSoft,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  modalTitle: {
    color: BRAND.text,
    fontSize: 24,
    fontWeight: '800',
  },
  modalClose: {
    color: BRAND.blue,
    fontWeight: '700',
  },
  galleryContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  galleryImageRow: {
    gap: 10,
    paddingTop: 12,
  },
  galleryModalCard: {
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 24,
    padding: 14,
  },
  galleryModalImage: {
    width: 230,
    height: 210,
    borderRadius: 18,
    backgroundColor: '#edf2f9',
  },
  galleryModalTitle: {
    color: BRAND.blue,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
  },
  galleryModalText: {
    color: BRAND.blue,
    lineHeight: 21,
    marginTop: 6,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  imageBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3,13,29,0.95)',
    justifyContent: 'center',
    padding: 20,
  },
  imageCloseButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  imageCloseText: {
    color: BRAND.white,
    fontWeight: '700',
  },
  imageStage: {
    flex: 1,
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  productModalContent: {
    padding: 20,
    paddingBottom: 36,
    gap: 14,
  },
  productModalName: {
    color: BRAND.text,
    fontSize: 24,
    fontWeight: '800',
  },
  productModalCategory: {
    color: BRAND.yellowDark,
    fontWeight: '700',
  },
  productModalPrice: {
    color: BRAND.blue,
    fontSize: 20,
    fontWeight: '800',
  },
  productModalText: {
    color: BRAND.muted,
    lineHeight: 22,
  },
  productModalButton: {
    backgroundColor: BRAND.yellow,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  productModalButtonText: {
    color: BRAND.blueDark,
    fontWeight: '800',
  },
  notificationList: {
    padding: 20,
    paddingBottom: 36,
    gap: 14,
  },
  notificationCard: {
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 20,
    padding: 14,
  },
  notificationCardUnread: {
    borderColor: BRAND.yellowDark,
  },
  notificationImage: {
    width: '100%',
    height: 170,
    borderRadius: 16,
    backgroundColor: '#edf2f9',
    marginBottom: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  notificationType: {
    color: BRAND.yellowDark,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  unreadDot: {
    color: BRAND.blue,
    backgroundColor: '#deebff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
    fontWeight: '700',
    fontSize: 12,
  },
  notificationTitle: {
    color: BRAND.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  notificationBody: {
    color: BRAND.muted,
    lineHeight: 21,
    marginTop: 6,
  },
  notificationDate: {
    color: BRAND.muted,
    fontSize: 12,
    marginTop: 10,
  },
  chatWebview: {
    flex: 1,
    backgroundColor: BRAND.white,
  },
  sheetCard: {
    backgroundColor: BRAND.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 24,
    maxHeight: '75%',
  },
  cartContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  cartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fbff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  cartMeta: {
    flex: 1,
  },
  cartName: {
    color: BRAND.text,
    fontWeight: '700',
  },
  cartQty: {
    color: BRAND.muted,
    marginTop: 4,
  },
  cartPrice: {
    color: BRAND.blue,
    fontWeight: '800',
  },
  cartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  totalLabel: {
    color: BRAND.text,
    fontWeight: '700',
    fontSize: 16,
  },
  totalValue: {
    color: BRAND.blue,
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryWideButton: {
    marginHorizontal: 20,
    backgroundColor: '#edf4ff',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryWideButtonText: {
    color: BRAND.blue,
    fontWeight: '800',
  },
  emptyText: {
    color: BRAND.muted,
  },
});
